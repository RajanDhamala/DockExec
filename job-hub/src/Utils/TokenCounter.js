
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
  const now = new Date();

  try {
    let redisData = await RedisClient.hGetAll(key);

    let monthlyLimit, tokenUsed, cycleEndsAt;
    if (!redisData || !redisData.monthlyLimit) {
      const dbData = await TokenQuota.findOne({ userId: usrId });

      if (!dbData) {
        return { message: "User token quota not found" };
      }

      monthlyLimit = dbData.monthlyLimit;
      tokenUsed = dbData.tokenUsed;
      cycleEndsAt = new Date(dbData.cycleEndsAt);

      await RedisClient.hSet(key, {
        monthlyLimit: dbData.monthlyLimit.toString(),
        tokenUsed: dbData.tokenUsed.toString(),
        cycleEndsAt: dbData.cycleEndsAt.toISOString(),
        cycleStartsAt: dbData.cycleStartsAt.toISOString(),
      });
      await RedisClient.expire(key, 30 * 24 * 60 * 60);
    } else {
      monthlyLimit = parseInt(redisData.monthlyLimit);
      tokenUsed = parseInt(redisData.tokenUsed);
      cycleEndsAt = new Date(redisData.cycleEndsAt);
    }
    if (now > cycleEndsAt) {
      const newCycleEnd = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000
      );

      await TokenQuota.findOneAndUpdate(
        { userId: usrId },
        {
          $set: {
            tokenUsed: 0,
            cycleStartsAt: now,
            cycleEndsAt: newCycleEnd,
            lastResetAt: now,
          },
        }
      );
      await RedisClient.hSet(key, {
        tokenUsed: "0",
        cycleStartsAt: now.toISOString(),
        cycleEndsAt: newCycleEnd.toISOString(),
      });

      tokenUsed = 0;
      cycleEndsAt = newCycleEnd;
    }
    const requestTokens = countTokens(code);
    console.log("request tokens:", requestTokens);

    if (tokenUsed + requestTokens > monthlyLimit) {
      return {
        message: "Token limit exceeded",
        used: tokenUsed,
        limit: monthlyLimit,
      };
    }
    return {
      tokenCount: requestTokens,
      tokenData: {
        monthlyLimit,
        tokenUsed: tokenUsed + requestTokens,
      },
    };
  } catch (err) {
    console.error("Error in TokenCounter:", err);
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

