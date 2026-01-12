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

  try {
    const data = await RedisClient.hGetAll(key);

    let monthlyLimit, tokenUsed;

    if (!data || !data.monthlyLimit) {
      const dbData = await TokenQuota.findOne({ userId: req.user.id });

      if (!dbData) {
        return res.status(400).json({ message: "User token quota not found" });
      }

      await RedisClient.hSet(key, {
        monthlyLimit: dbData.monthlyLimit.toString(),
        tokenUsed: dbData.tokenUsed.toString(),
        cycleEndsAt: dbData.cycleEndsAt.toString(),
        cycleStartsAt: dbData.cycleStartsAt.toString()
      });
      await RedisClient.expire(key, 30 * 24 * 60 * 60);

      monthlyLimit = dbData.monthlyLimit;
      tokenUsed = dbData.tokenUsed;
    } else {
      monthlyLimit = parseInt(data.monthlyLimit);
      tokenUsed = parseInt(data.tokenUsed);
    }

    let requestTokens = 0;
    if (req.body) {
      const text = typeof req.body === "string"
        ? req.body
        : JSON.stringify(req.body);
      requestTokens = countTokens(text);
    }
    console.log("token used:", tokenUsed)
    console.log("monthlyLimit:", monthlyLimit)
    if (tokenUsed + requestTokens > monthlyLimit) {
      return res.status(429).json({
        message: "Token limit exceeded",
        used: tokenUsed,
        limit: monthlyLimit
      });
    }

    // const newTokenUsed = await RedisClient?.hIncrBy(key, "tokenUsed", requestTokens);
    const objectSchema = {
      userId: req.user.id,
      tokenConsumed: requestTokens,
      endpoint: req.route.path,
      createdAt: new Date()
    }
    // const RabbitClient = await getRabbit()
    // await RabbitClient.sendToQueue("logQueue", Buffer.from(JSON.stringify(objectSchema)), { persistent: true });
    // console.log("rabbit message pushed")
    // await RedisClient.sAdd("dirty_users", req.user.id); // mark user as updated
    req.tokenData = { monthlyLimit, tokenUsed: tokenUsed + requestTokens };
    req.tokenCount = requestTokens;

    next();

  } catch (err) {
    console.error("Error in token middleware:", err);
    return res.status(500).json({ message: "Token validation failed" });
  }
};


export default countTokenMiddle;
