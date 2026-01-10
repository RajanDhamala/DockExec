import express from "express";
import TokenRouter from "./src/Routes/TokenRoute.js";
import ProfileRouter from "./src/Routes/ProfileRoute.js";
import { GithubProvider, GoogleProvider } from './src/GithubProvider.js';
import cookieParser from "cookie-parser";
import cors from "cors";
import UserRouter from "./src/Routes/UserRoute.js"
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
import { getRabbit } from "./src/Utils/ConnectRabbit.js"

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

app.use(express.json({ limit: "3mb" }));
app.use(express.urlencoded({ extended: true, limit: "3mb" }));


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
(async () => {
  const channel = await getRabbit(); // already a channel

  try {
    console.log("Setting up RabbitMQ...");

    // Exchanges
    await channel.assertExchange("code_exchange", "topic", { durable: true });

    // Queues
    await channel.assertQueue("programiz_result", { durable: true });
    await channel.assertQueue("print_test_result", { durable: true });
    await channel.assertQueue("all_test_result", { durable: true });
    await channel.assertQueue("blocked_exec", { durable: true });

    // Bindings
    await channel.bindQueue("programiz_result", "code_exchange", "programmiz_result");
    await channel.bindQueue("print_test_result", "code_exchange", "print_test_result");
    await channel.bindQueue("all_test_result", "code_exchange", "all_test_result");
    await channel.bindQueue("blocked_exec", "code_exchange", "blocked_execution");

    console.log("RabbitMQ setup complete, waiting for messages...");

    // Consumers
    channel.consume("programiz_result", async (msg) => {
      if (!msg) return;
      console.log(" i got programmiz_result")
      const data = JSON.parse(msg.content.toString());
      await emitProgrammizResult(data);
      await LogRawExecution(data);
      channel.ack(msg);
    });

    channel.consume("print_test_result", async (msg) => {
      if (!msg) return;
      const data = JSON.parse(msg.content.toString());
      await emitSingleTestresult(data);
      LogTrialResult(data)
      channel.ack(msg);
    });

    channel.consume("all_test_result", async (msg) => {
      if (!msg) return;
      const data = JSON.parse(msg.content.toString());
      console.log(" Job result received:", data);
      if (data?.testCaseId) {
        await emitAllCaseResult(data);
        await save2Redis(data)
        if (data.testCaseNumber !== data.totalTestCases) {
          console.log(" this is final test case no")
        } else {
          const key = `job:${data.jobId}`;
          const all = await RedisClient.hGetAll(key);
          console.log("all data:", all)
          await saveTest2db(all)
          await LogTestCaseResult(all)
        }
      }
      channel.ack(msg);
    });

    channel.consume("blocked_exec", async (msg) => {
      if (!msg) return;
      const data = JSON.parse(msg.content.toString());
      await emitBlockedresult(data);
      channel.ack(msg);
    });
  } catch (err) {
    console.error("Failed to work with RabbitMQ broker:", err);
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
app.use("/profile", ProfileRouter)
app.use("/notification", NotificationRouter)
app.use("/token", TokenRouter)

export default app
