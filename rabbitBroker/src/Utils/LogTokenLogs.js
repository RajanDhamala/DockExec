import TokenLog from "../Schemas/TokenLog.js"
import { RedisClient } from "./ConnectRedis.js";
import TokenQuota from "../Schemas/TokenQuotaSchema.js"
const BATCH_SIZE = 100;        // max messages per bulk insert
const BATCH_INTERVAL = 150000;

let buffer = []

const LogBulkToken = async (data) => {
  buffer.push(data)
  if (buffer.length >= BATCH_SIZE) {
    FlushBuffer()
  }
}

const FlushBuffer = async () => {
  if (buffer.length == 0) {
    return
  }
  await UpdateTokenLogs(buffer)
  buffer = []
}


const UpdateTokenLogs = async (data) => {
  try {
    const bulkinsert = await TokenLog.insertMany(data)
    console.log("data inseted in bulk btw")
  } catch (err) {
    console.log("failed to insert data in bulk", err)
  }
}

const getActiveUsers = async () => {
  const dirtyUsers = await RedisClient.sMembers("dirty_users");
  console.log("dirty user:", dirtyUsers)
  const bulkOps = [];

  for (const userId of dirtyUsers) {
    console.log("id:", userId)
    const key = `tokenQuota:${userId}`;
    const tokensUsed = await RedisClient.hGet(key, "tokenUsed");
    console.log("token usaed:", tokensUsed)
    if (tokensUsed !== null) {
      bulkOps.push({
        updateOne: {
          filter: { userId },
          update: { $set: { tokenUsed: Number(tokensUsed) } },
          upsert: true
        }
      });
    }
  }

  if (bulkOps.length > 0) {
    await UpdateDbToken(bulkOps);
    await RedisClient.del("dirty_users");
  }
};

const UpdateDbToken = async (bulkOps) => {
  if (!bulkOps || bulkOps.length === 0) return;

  try {
    await TokenQuota.bulkWrite(bulkOps);
    console.log(`Successfully updated ${bulkOps.length} users' tokenUsed`);
    await RedisClient.del("dirty_users");
  } catch (err) {
    console.error("Error updating tokenUsed in DB:", err);
  }
};

export { LogBulkToken, FlushBuffer, getActiveUsers }
