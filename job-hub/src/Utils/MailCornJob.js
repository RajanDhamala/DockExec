import TokenQuota from "../Schemas/TokenQuotaSchema.js";
import { getRabbit } from "./ConnectRabbit.js";
import CronJob from "../Schemas/CornJobSchema.js";

const RabbitClient = await getRabbit();
const BATCH_LIMIT = 400;
const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;
const TWO_MINUTES_MS = 2 * 60 * 1000;

const runReconnectEmailCron = async (res) => {
  let jobId = "reconnectEmails"
  let cronDoc = await CronJob.findById("reconnectEmails");
  if (!cronDoc) {
    const nextRun = new Date();
    nextRun.setDate(nextRun.getDate() + 15);

    cronDoc = await CronJob.create({
      _id: "reconnectEmails",
      lastRun: null,
      nextRun,
      status: "idle"
    });
    console.log(`Cron doc "${jobId}" created. Next run at ${nextRun}`);
    return
  }

  const now = new Date();
  if (now < cronDoc.nextRun) return console.log("Reconnect cron not scheduled yet");
  if (cronDoc.status === "running") return console.log("Reconnect cron already running");
  cronDoc.status = "running";
  await cronDoc.save();

  try {
    // const fifteenAgo = new Date(Date.now() - TWO_MINUTES_MS);

    const fifteenAgo = new Date(Date.now() - FIFTEEN_DAYS_MS);

    const inactiveUsers = await TokenQuota.aggregate([
      { $match: { updatedAt: { $lt: fifteenAgo } } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: "$userDetails" },
      {
        $project: {
          _id: 0,
          userId: 1,
          tokenUsed: 1,
          fullname: "$userDetails.fullname",
          points: "$userDetails.points",
          email: "$userDetails.email",
          solvedTestCaseCount: {
            $size: { $ifNull: ["$userDetails.solvedTestCases", []] }
          }
        }
      },
      { $limit: BATCH_LIMIT }
    ]);

    console.log("Reconnect inactive users:", inactiveUsers);

    if (inactiveUsers.length > 0) {
      const mailObject = {
        type: "reconnect-mail",
        data: { inactiveUsers }
      };
      await RabbitClient.sendToQueue("mail", Buffer.from(JSON.stringify(mailObject)), { persistent: true });
    }

    cronDoc.lastRun = now;
    const nextRun = new Date();
    nextRun.setDate(nextRun.getDate() + 15);
    cronDoc.nextRun = nextRun;
    cronDoc.status = "idle";
    await cronDoc.save();

    console.log(`Reconnect cron finished. Next run at ${nextRun}`);
  } catch (err) {
    cronDoc.status = "idle";
    await cronDoc.save();
    console.error("Reconnect cron failed:", err);
  }
};

const runReviewEmailCron = async () => {
  const jobId = "reviewEmails"
  let cronDoc = await CronJob.findById("reviewEmails");
  if (!cronDoc) {
    const nextRun = new Date();
    nextRun.setDate(nextRun.getDate() + 15);

    cronDoc = await CronJob.create({
      _id: "reviewEmails",
      lastRun: null,
      nextRun,
      status: "idle"
    });
    console.log(`Cron doc "${jobId}" created. Next run at ${nextRun}`);
    return
  }

  const now = new Date();

  if (now < cronDoc.nextRun) return console.log("Review cron not scheduled yet");
  if (cronDoc.status === "running") return console.log("Review cron already running");

  cronDoc.status = "running";
  await cronDoc.save();

  try {

    // const fifteenAgo = new Date(Date.now() - TWO_MINUTES_MS);
    const fifteenAgo = new Date(Date.now() - FIFTEEN_DAYS_MS);

    const inactiveUsers = await TokenQuota.aggregate([
      { $match: { updatedAt: { $lt: fifteenAgo } } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: "$userDetails" },
      {
        $project: {
          _id: 0,
          userId: 1,
          fullname: "$userDetails.fullname",
          points: "$userDetails.points",
          email: "$userDetails.email"
        }
      },
      { $limit: BATCH_LIMIT }
    ]);

    console.log("Review inactive users:", inactiveUsers.length);

    if (inactiveUsers.length > 0) {
      const mailObject = {
        type: "review-mail",
        data: { inactiveUsers }
      };
      await RabbitClient.sendToQueue("mail", Buffer.from(JSON.stringify(mailObject)), { persistent: true });
    }

    cronDoc.lastRun = now;
    const nextRun = new Date();
    nextRun.setDate(nextRun.getDate() + 15);
    cronDoc.nextRun = nextRun;
    cronDoc.status = "idle";
    await cronDoc.save();
    console.log(`Review cron finished. Next run at ${nextRun}`);

  } catch (err) {
    cronDoc.status = "idle";
    await cronDoc.save();
    console.error("Review cron failed:", err);
    throw new Error()
  }
};


export { runReviewEmailCron, runReconnectEmailCron }
