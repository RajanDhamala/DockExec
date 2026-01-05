import { createClient } from "redis";

let RedisClient;
const connectRedis = async () => {
  try {
    RedisClient = await createClient({
      url: process.env.REDIS_URL,
    }).connect();
    console.log("Redis connected successfully");
  } catch (err) {
    console.log("Redis Client Error", err)
  }
}

export { RedisClient, connectRedis };
