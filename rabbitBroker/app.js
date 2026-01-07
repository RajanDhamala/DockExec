import amqplib from "amqplib";
import ConnectDb from "./src/Utils/ConnectDB.js"
import dotenv from "dotenv"
import { LogBulkToken, FlushBuffer, getActiveUsers } from "./src/Utils/LogTokenLogs.js";
import { connectRedis } from "./src/Utils/ConnectRedis.js";
import { runLuaScript } from "./src/Utils/LuaRedis.js"
import { SyncLeaderboard } from "./src/Utils/LeaderBoardSync.js"

dotenv.config({})

const consumeJobs = async () => {
  try {
    await ConnectDb()
    await connectRedis()
    setInterval(FlushBuffer, 10000)
    setInterval(getActiveUsers, 5000)
    setInterval(SyncLeaderboard, 150000)
    const conn = await amqplib.connect("amqp://guest:guest@localhost:5672");
    const channel = await conn.createChannel();
    // setInterval(runLuaScript, 5000)
    await channel.assertQueue("logQueue", { durable: true });
    console.log(`Waiting for jobs in queue on:logQueue ..`);

    channel.consume(
      "logQueue",
      async (msg) => {
        if (msg !== null) {
          const job = msg.content.toString();
          const jsonData = await JSON.parse(job)
          await LogBulkToken(jsonData)
          console.log("we got data", jsonData)
          channel.ack(msg);
        }
      },
      { noAck: false }
    );
  } catch (err) {
    console.error("Error consuming jobs:", err);
  }
}


consumeJobs()
