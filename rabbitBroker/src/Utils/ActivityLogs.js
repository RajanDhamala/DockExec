import RecentActivity from "../Schemas/RecentActivitySchema.js"
import { RedisClient } from "./ConnectRedis.js"


let buffer = []
const buffersize = 100

const InsertLogBuffer = async (data) => {
  buffer.push(data)
  console.log("data pushed inside the buffer")

  if (buffer.length >= buffersize) {
    await FlushUserActivityBuffer()
  }
}

const FlushUserActivityBuffer = async () => {
  if (buffer.length === 0) return

  console.log("Flushing buffer to MongoDB...")

  const grouped = buffer.reduce((acc, log) => {
    if (!acc[log.userId]) acc[log.userId] = []
    acc[log.userId].push(log.activity)
    return acc
  }, {})

  const bulkOps = Object.entries(grouped).map(([userId, activities]) => ({
    updateOne: {
      filter: { userId },
      update: {
        $push: { MetaData: { $each: activities, $position: 0, $slice: 100 } }
      }
    }
  }))

  if (bulkOps.length > 0) {
    await RecentActivity.bulkWrite(bulkOps)
  }

  buffer = []
}


const PushActivity2Redis = async (data) => {
  const { userId, activity } = data;

  if (!userId || !activity) return;

  const key = `user:activity:${userId}`;
  console.log("user id:", userId)
  await RedisClient.multi()
    .lPush(key, JSON.stringify(activity))
    .lTrim(key, 0, 5)
    .expire(key, 60 * 60 * 2) // 2 hrs ttl
    .exec();

}


export { InsertLogBuffer, FlushUserActivityBuffer, PushActivity2Redis }
