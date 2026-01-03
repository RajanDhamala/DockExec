
import { encoding_for_model } from "tiktoken";
import { RedisClient } from "../Utils/RedisClient.js";
import TokenQuota from "../Schemas/TokenQuotaSchema.js";

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

    const requestTokens = countTokens(code);

    if (tokenUsed + requestTokens > monthlyLimit) {
      return {
        message: "Token limit exceeded",
        used: tokenUsed,
        limit: monthlyLimit,
      };
    }

    await RedisClient.hIncrBy(key, "tokenUsed", requestTokens);

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

export default TokenCounter;

