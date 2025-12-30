import express from "express";
import ProfileRouter from "./src/Routes/ProfileRoute.js";
import { GithubProvider, GoogleProvider } from './src/GithubProvider.js';
import cookieParser from "cookie-parser";
import cors from "cors";
import UserRouter from "./src/Routes/UserRoute.js"
import { producer, consumer, initkafka } from "./src/Utils/KafkaProvider.js";
import ApiRouter from "./src/Routes/ApiRoute.js";
import { emitSingleTestresult, emitBlockedresult, emitAllCaseResult, emitProgrammizResult } from "./src/Utils/FafkaSocet.js";
import CodeRouter from "./src/Routes/CodeRoute.js"
import { connectRedis, RedisClient } from "./src/Utils/RedisClient.js";
import { save2Redis, saveTest2db } from "./src/Utils/RedisUtils.js";
import { LogTrialResult, LogRawExecution, LogTestCaseResult } from "./src/Controllers/ExecutionLogs.js"
import client from "prom-client";
import dotenv from "dotenv"
import { loginOrLinkUser } from "./src/Utils/OuthUtils.js";
import NotificationRouter from "./src/Routes/NotificationRoute.js"

dotenv.config()

const app = express();
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}))
client.collectDefaultMetrics({ register: client.register });

app.get("/metrics", async (req, res) => {
  try {
    res.setHeader("Content-Type", client.register.contentType);
    const metrics = await client.register.metrics();
    res.send(metrics);
  } catch (err) {
    console.error("Error fetching metrics:", err);
    res.status(500).send("Internal Server Error");
  }
});
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(express.json());

const onGithubSuccess = async (req, res, data) => {
  loginOrLinkUser(data, res, "githubProviderId")
};
const onGoogleSuccess = async (req, res, data) => {
  loginOrLinkUser(data, res, "googleProviderId")
};
const onError = async (req, res, error) => {
  console.error("OAuth failed:", error);
  return res.redirect(`${process.env.FRONTEND_URI}auth/error`);
};


GithubProvider(
  app,
  process.env.GITHUB_CLIENT_ID,
  process.env.GITHUB_CLIENT_SECRET,
  process.env.GITHUB_REDIRECT_URI,
  onGithubSuccess,
  onError
);

GoogleProvider(
  app,
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
  onGoogleSuccess,
  onError
);
await connectRedis();
//
// (async () => {
//   try {
//     await initkafka();
//     console.log(" Kafka ready, subscribing to topics...");
//     await connectRedis();
//     await consumer.subscribe({ topic: "programiz_result", fromBeginning: true });
//     await consumer.subscribe({ topic: "print_test_result", fromBeginning: true });
//     await consumer.subscribe({ topic: "all_test_result", fromBeginning: true })
//     await consumer.subscribe({ topic: "blocked_exec", fromBeginning: true })
//
//     await consumer.run({
//       eachMessage: async ({ topic, message }) => {
//         const value = message.value.toString();
//
//         let data = {};
//         try {
//           data = JSON.parse(value);
//         } catch {
//           data = { raw: value };
//         }
//         switch (topic) {
//
//           case "all_test_result":
//             // this gets data of all the test cases with print=false
//             console.log(" Job result received:", data);
//             if (data?.testCaseId) {
//               await emitAllCaseResult(data);
//               await save2Redis(data)
//               if (data.testCaseNumber !== data.totalTestCases) {
//                 console.log(" this is final test case no")
//               } else {
//                 const key = `job:${data.jobId}`;
//                 const all = await RedisClient.hGetAll(key);
//                 console.log("all data:", all)
//                 await saveTest2db(all)
//                 await LogTestCaseResult(all)
//               }
//             }
//             break;
//
//           case "blocked_exec":
//             console.log(" Blocked execution:", data);
//             await emitBlockedresult(data);
//             break;
//
//           case "print_test_result":
//             // this gets the result from single test case with print=true
//             console.log("we got data ok buddy", data)
//             console.log("No test cases, single job result");
//             await emitSingleTestresult(data);
//             await LogTrialResult(data)
//
//           case "programiz_result":
//             // this gets the result form the programmiz style execution
//             console.log("programmiz code result:", data);
//             await emitProgrammizResult(data);
//             await LogRawExecution(data)
//             break;
//
//           default:
//             console.warn(" Unknown topic received:", topic, data);
//             break;
//         }
//       },
//     });
//
//   } catch (err) {
//     console.error(" Kafka initialization failed:", err);
//   }
// })();
//



app.get("/", (req, res) => {
  res.send("Server is up and running");
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: "Internal Server Error" });
});

app.use("/users", UserRouter)
app.use("/api", ApiRouter)
app.use("/code", CodeRouter)
app.use("/profile", ProfileRouter)
app.use("/notification", NotificationRouter)

export default app;
