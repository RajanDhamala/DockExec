import User from "../Schemas/UserSchema.js"
import { AllTestCases } from "../Controllers/LeetCodeController.js"
import TokenQuota from "../Schemas/TokenQuotaSchema.js";
import { getRabbit } from "./ConnectRabbit.js";

const RabbitClient = await getRabbit()
const FindInactiveUsers = async (req, res) => {
  // const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;
  const FIFTEEN_DAYS_MS = 60 * 1000; // 1 min for test
  const fifteenAgo = new Date(Date.now() - FIFTEEN_DAYS_MS);


  const inactiveUsers = await TokenQuota.aggregate([
    {
      $match: {
        updatedAt: { $lt: fifteenAgo }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userDetails"
      }
    },
    {
      $unwind: "$userDetails"
    },
    {
      $project: {
        _id: 0,
        userId: 1,
        tokenUsed: 1,
        fullname: "$userDetails.fullname",
        points: "$userDetails.points",
        email: "$userDetails.email"
      }
    }, {
      $limit: 400
    }
  ]);

  console.log("incative users:", inactiveUsers)
  const mailObject = {
    type: "reconnect-mail",
    problemName: "Two Sum",
    data: {
      inactiveUsers
    }
  }
  await RabbitClient.sendToQueue("mail", Buffer.from(JSON.stringify(mailObject)), { persistent: true })
  return res.json({ "message": inactiveUsers })
}

export { FindInactiveUsers }
