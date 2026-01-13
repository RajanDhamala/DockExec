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

const countTokenMiddle = async (req, res, next) => {
  const key = `tokenQuota:${req.user.id}`;
  const now = Date.now();

  try {
    let data = await RedisClient.hGetAll(key);

    if (!data || !data.monthlyLimit) {
      const dbData = await TokenQuota.findOne({ userId: req.user.id });
      if (!dbData) {
        return res.status(400).json({ message: "Token quota not found" });
      }

      data = {
        monthlyLimit: dbData.monthlyLimit.toString(),
        tokenUsed: dbData.tokenUsed.toString(),
        cycleEndsAt: dbData.cycleEndsAt.getTime().toString(),
        cycleStartsAt: dbData.cycleStartsAt.toString()
      };

      await RedisClient.hSet(key, data);
      await RedisClient.expire(key, 30 * 24 * 60 * 60);
    }

    let monthlyLimit = Number(data.monthlyLimit);
    let tokenUsed = Number(data.tokenUsed);
    let cycleEndsAt = Number(data.cycleEndsAt);

    if (now > cycleEndsAt) {
      tokenUsed = 0;
      cycleEndsAt = new Date(
        now + 30 * 24 * 60 * 60 * 1000
      ).getTime();

      await RedisClient.hSet(key, {
        tokenUsed: "0",
        cycleEndsAt: cycleEndsAt.toString()
      });
    }

    const text =
      typeof req.body === "string"
        ? req.body
        : JSON.stringify(req.body ?? {});
    const requestTokens = countTokens(text);

    if (tokenUsed + requestTokens > monthlyLimit) {
      return res.status(429).json({
        message: "Token limit exceeded",
        used: tokenUsed,
        limit: monthlyLimit
      });
    }

    req.tokenCount = requestTokens;
    await RedisClient.sAdd("dirty_users", req.user.id);
    next();
  } catch (err) {
    console.error("Token middleware error:", err);
    res.status(500).json({ message: "Token validation failed" });
  }
};

export default countTokenMiddle;
