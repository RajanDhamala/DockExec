import TokenLog from "../Schemas/TokenLog.js"
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
    console.log("failed to inset data in bulk", err)
  }
}

export { LogBulkToken, FlushBuffer }
