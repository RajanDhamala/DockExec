import { RedisClient } from "./ConnectRedis.js";

const runLuaScript = async () => {
  try {
    const luaScript = `
    local usernameKey1 = KEYS[1]
    local usernameKey2 = KEYS[2]

    local userId1 = ARGV[1]  -- pass real userIds
    local userId2 = ARGV[2]

    -- Check if first user exists
    if redis.call("EXISTS", usernameKey1) == 1 then
      return {err="User "..usernameKey1.." already exists"}
    end

    -- Check if second user exists
    if redis.call("EXISTS", usernameKey2) == 1 then
      return {err="User "..usernameKey2.." already exists"}
    end

    -- Set the users
    redis.call("SET", usernameKey1, userId1)
    redis.call("SET", usernameKey2, userId2)

    return "OK"
  `;

    const result = await RedisClient.eval(luaScript, {
      keys: ["username:RajanDhamala", "username:Tinku"],
      arguments: ["user42", "user99"],
    });

    console.log(result);
  } catch (err) {
    console.log("redis write failed")
  }

};



export { runLuaScript }
