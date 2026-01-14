import { RedisClient } from "../Utils/RedisClient.js"

const endpoints = {
  login: { max: 5, ttl: 120 },   // 5 requests per 2 min
  register: { max: 2, ttl: 60 },    // 2 requests per min
  oauthLogin: { max: 3, ttl: 60 },    // 3 requests per min
  reset_password: { max: 2, ttl: 300 },  // 2 requests per 5 min
  forgot_password: { max: 2, ttl: 200 }
};

const luascript = `
local key = KEYS[1]
local max = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])

local data = redis.call("GET", key)

if not data then
    redis.call("SET", key, 1, "EX", ttl)
    return {1, ttl}  -- allowed
end

local numberCount = tonumber(data)

if numberCount >= max then
    local timeLeft = redis.call("TTL", key)
    return {0, timeLeft}  -- blocked
else
    redis.call("INCR", key)
    local timeLeft = redis.call("TTL", key)
    return {1, timeLeft}  -- allowed
end
`;


const RedisLimiter = (route) => {
  return async (req, res, next) => {
    const key = `rl:${route}:${req.ip}`;
    const max = endpoints[route].max;
    const ttl = endpoints[route].ttl;

    const result = await RedisClient.eval(luascript, {
      keys: [key],
      arguments: [String(max), String(ttl)]
    });

    const isallowed = result[0];
    const timeleft = result[1];

    if (isallowed === 1) {
      return next();
    }

    return res.status(429).json({
      message: "Too many requests",
      remaining: timeleft
    });
  };
};



export default RedisLimiter
