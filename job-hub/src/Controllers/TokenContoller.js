import asyncHandler from "../Utils/AsyncHandler.js"
import ApiResponse from "../Utils/ApiResponse.js"
import ApiError from "../Utils/ApiError.js"
import TokenLog from "../Schemas/TokenLogsSchema.js"
import TokenQuota from "../Schemas/TokenQuotaSchema.js"
import { RedisClient } from "../Utils/RedisClient.js"
import mongoose from "mongoose"


const getUrToken = asyncHandler(async (req, res) => {
  const user = req.user;
  const key = `tokenQuota:${user.id}`;

  let data = await RedisClient.hGetAll(key);

  if (Object.keys(data).length === 0) {
    let isAvailable = await TokenQuota.findOne({ userId: user.id });
    if (!isAvailable) {
      const now = new Date();
      console.log("user has no token quota started btw")
      const cycleEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const userdata = await TokenQuota.create({
        userId: user.id,
        cycleStartsAt: now,
        cycleEndsAt: cycleEnd
      });


      return res.send(new ApiResponse(200, "User token initialized", userdata));
    }
    await RedisClient.hSet(key, {
      monthlyLimit: isAvailable.monthlyLimit.toString(),
      tokenUsed: isAvailable.tokenUsed.toString(),
      cycleStartsAt: isAvailable.cycleStartsAt.toISOString(),
      cycleEndsAt: isAvailable.cycleEndsAt.toISOString()
    });
    await RedisClient.expire(key, 30 * 24 * 60 * 60);



    return res.send(new ApiResponse(200, "Fetched user token from DB", isAvailable));
  }

  return res.send(new ApiResponse(200, "Fetched token data from Redis", data));
});

const getTokenUsageGraph = asyncHandler(async (req, res) => {
  const user = req.user;
  let { month, year } = req.query
  month = Number(month);
  year = Number(year);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // getMonth() is 0-indexed

  if (year > currentYear || (year === currentYear && month > currentMonth)) {
    throw new ApiError(400, null, "invalid month year")
  }

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const result = await TokenLog.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(user.id),
        createdAt: { $gte: start, $lt: end }
      }
    },
    {
      $group: {
        _id: { $dayOfMonth: "$createdAt" },
        totalTokens: { $sum: "$tokenConsumed" }
      }
    },
    { $sort: { "_id": 1 } }
  ]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const usagePerDay = Array.from({ length: daysInMonth }, (_, i) => {
    const dayData = result.find(r => r._id === i + 1);
    return {
      day: i + 1,
      totalTokens: dayData ? dayData.totalTokens : 0
    };
  });

  return res.send(new ApiResponse(200, "Successfully fetched graph", usagePerDay));
});



export { getUrToken, getTokenUsageGraph }



