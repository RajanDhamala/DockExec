
import { encoding_for_model } from "tiktoken";
import { RedisClient } from "../Utils/RedisClient.js";
import TokenQuota from "../Schemas/TokenQuotaSchema.js";
import { getRabbit } from "./ConnectRabbit.js";


const RabbitClient = await getRabbit()

const countTokens = (text) => {
  try {
    const enc = encoding_for_model("gpt-3.5-turbo");
    const tokens = enc.encode(text);
    enc.free();
    return tokens.length;
  } catch (err) {
    console.error("Error counting tokens:", err);
    return 0;
  }
};

const TokenCounter = async ({ code, language }, usrId) => {
  const key = `tokenQuota:${usrId}`;
  console.log("data recived:", usrId, code)
  let requestTokens
  try {
    let redisData = await RedisClient.hGetAll(key);
    let monthlyLimit, tokenUsed;

    if (!redisData || !redisData.monthlyLimit) {
      const dbData = await TokenQuota.findOne({ userId: usrId });

      if (!dbData) {
        return { message: "User token quota not found" };
      }

      await RedisClient.hSet(key, {
        monthlyLimit: dbData.monthlyLimit.toString(),
        tokenUsed: dbData.tokenUsed.toString(),
        cycleEndsAt: dbData.cycleEndsAt.toString(),
        cycleStartsAt: dbData.cycleStartsAt.toString(),
      });
      await RedisClient.expire(key, 30 * 24 * 60 * 60);

      monthlyLimit = dbData.monthlyLimit;
      tokenUsed = dbData.tokenUsed;
    } else {
      monthlyLimit = parseInt(redisData.monthlyLimit);
      tokenUsed = parseInt(redisData.tokenUsed);
    }

    requestTokens = countTokens(code);
    console.log("reques tokens:", requestTokens)
    if (tokenUsed + requestTokens > monthlyLimit) {
      return {
        message: "Token limit exceeded",
        used: tokenUsed,
        limit: monthlyLimit,
      };
    }
    const tokenData = { monthlyLimit, tokenUsed: tokenUsed + requestTokens };
    const tokenCount = requestTokens;

    return {
      tokenCount,
      tokenData,
    };
  } catch (err) {
    console.error("Error in token middleware:", err);
    return { message: "token validation failed" };
  }
};

const IncreaseToken = async (usrId, tokenLen, route) => {
  const key = `tokenQuota:${usrId}`;
  const finalToken = await RedisClient.hIncrBy(key, "tokenUsed", tokenLen);
  const objectSchema = {
    userId: usrId,
    tokenConsumed: tokenLen,
    endpoint: route,
    createdAt: new Date()
  }

  await RabbitClient.sendToQueue("logQueue", Buffer.from(JSON.stringify(objectSchema)), { persistent: true });
  await RedisClient.sAdd("dirty_users", usrId);
  return finalToken
}

export { TokenCounter, IncreaseToken };

