import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import UserRouter from "./src/Routes/UserRoute.js"
import { producer, consumer, initkafka } from "./src/Utils/KafkaProvider.js";
import ApiRouter from "./src/Routes/ApiRoute.js";
import { emitTestresult, emitBlockedresult, emitTestCaseresult, emitActuallyRunResult } from "./src/Utils/FafkaSocet.js";
import CodeRouter from "./src/Routes/CodeRoute.js"
import { connectRedis, RedisClient } from "./src/Utils/RedisClient.js";
import { save2Redis, saveTest2db } from "./src/Utils/RedisUtils.js";
import { LogTrialResult, LogRawExecution, LogTestCaseResult } from "./src/Controllers/ExecutionLogs.js"

const app = express();


app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

(async () => {
  try {
    await initkafka();
    console.log(" Kafka ready, subscribing to topics...");
    await connectRedis();
    await consumer.subscribe({ topic: "job_results", fromBeginning: true });
    await consumer.subscribe({ topic: "blocked_exec", fromBeginning: true });
    await consumer.subscribe({ topic: "Actually_runs_result", fromBeginning: true })
    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        const value = message.value.toString();

        let data = {};
        try {
          data = JSON.parse(value);
        } catch {
          data = { raw: value };
        }
        switch (topic) {
          case "job_results":
            console.log(" Job result received:", data);
            if (data?.testCaseId) {
              await emitTestCaseresult(data);
              await save2Redis(data)
              if (data.testCaseNumber !== data.totalTestCases) {
                console.log(" this is final test case no")
              } else {
                const key = `job:${data.jobId}`;
                const all = await RedisClient.hGetAll(key);
                console.log("all data:",all)
                // await saveTest2db(all)
                await LogTestCaseResult(all)
                // console.log("this is not final test case no")
              }
            }
            else if (data?.jobId !== "") {
              console.log("No test cases, single job result");
              await emitTestresult(data);
              await LogRawExecution(data)
            }
            else {
              // nothing to do
              return;
            }
            break;

          case "blocked_exec":
            console.log(" Blocked execution:", data);
            await emitBlockedresult(data);
            break;

          case "Actually_runs_result":
            console.log(" Actual run result:", data);
            await emitActuallyRunResult(data);

            await LogTrialResult(data)
            break;

          default:
            console.warn(" Unknown topic received:", topic, data);
            break;
        }
      },
    });

  } catch (err) {
    console.error(" Kafka initialization failed:", err);
  }
})();

app.get("/", (req, res) => {
  res.send("Server is up and running");
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: "Internal Server Error" });
});

app.use("/users", UserRouter)
app.use("/api", ApiRouter)
app.use("/code", CodeRouter)

export default app;
