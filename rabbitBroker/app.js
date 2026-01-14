import amqplib from "amqplib";
import { handelEmail } from "./src/Utils/HandelEmail.js";
import ConnectDb from "./src/Utils/ConnectDB.js"
import dotenv from "dotenv"
import { LogBulkToken, FlushBuffer, getActiveUsers } from "./src/Utils/LogTokenLogs.js";
import { connectRedis, RedisClient } from "./src/Utils/ConnectRedis.js";
// import { runLuaScript } from "./src/Utils/LuaRedis.js"
import { SyncLeaderboard } from "./src/Utils/LeaderBoardSync.js"
import { InsertLogBuffer, FlushUserActivityBuffer, PushActivity2Redis } from "./src/Utils/ActivityLogs.js"

dotenv.config({})

const consumeJobs = async () => {
  try {
    await ConnectDb()
    await connectRedis()
    setInterval(FlushBuffer, 150000)
    setInterval(getActiveUsers, 150000)
    setInterval(SyncLeaderboard, 150000)
    setInterval(FlushUserActivityBuffer, 150000)
    const conn = await amqplib.connect("amqp://guest:guest@localhost:5672");
    const channel = await conn.createChannel();
    // setInterval(runLuaScript, 5000)
    await channel.assertQueue("logQueue", { durable: true });
    await channel.assertQueue("Activity_Logs", { durable: true });
    await channel.assertQueue("mail", { durable: true });

    await channel.assertQueue("mail", { durable: true });
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

    channel.consume("Activity_Logs", async (msg) => {
      if (msg !== null) {
        const job = msg.content.toString();
        const jsonData = await JSON.parse(job)
        console.log("activity logs:", jsonData)
        await PushActivity2Redis(jsonData)
        await InsertLogBuffer(jsonData)
        channel.ack(msg)
      }
    })

    channel.consume("mail", async (msg) => {
      if (msg !== null) {
        const job = msg.content.toString();
        const jsonData = await JSON.parse(job)
        console.log("mail logs:", jsonData)
        handelEmail(jsonData, msg, channel)
      }
    })

  } catch (err) {
    console.error("Error consuming jobs:", err);
  }
}


consumeJobs()
