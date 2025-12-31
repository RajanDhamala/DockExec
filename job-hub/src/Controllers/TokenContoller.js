import asyncHandler from "../Utils/AsyncHandler.js"
import ApiResponse from "../Utils/ApiResponse.js"
import TokenLog from "../Schemas/TokenLogsSchema.js"
import TokenQuota from "../Schemas/TokenQuotaSchema.js"
import {RedisClient} from "../Utils/RedisClient.js"


const getUrToken = asyncHandler(async (req, res) => {
  const user = req.user
  // const { count } = req.tokenCount

  const key = `tokenQuota:${req.user.id}`;
  let data

  try {
    data = await RedisClient.hGetAll(key);
    console.log("data:",data)
    return res.send(new ApiResponse(200, "fetched token data", data))
  } catch (error) {
    console.log("error during redis call")
  }

  const isAvailable = await TokenQuota.findOne({ userId: user.id })
  if (!isAvailable) {
    const nowTimestamp = new Date()
    const cycleEnd = new Date(nowTimestamp + 30 * 24 * 60 * 60 * 1000);
    const userdata = await TokenQuota.create({
      userId: user.id,
      cycleStartsAt: nowTimestamp,
      cycleEndsAt: cycleEnd
    })
    return res.send(200, "usr token initlized", userdata)
  }
  return res.send(new ApiResponse(200, "fetched user tokenScheam", isAvailable))
})



export { getUrToken }


