import LeaderBoard from "../Schemas/LeaderBoardSchema.js";
import { RedisClient } from "./ConnectRedis.js";
import User from "../Schemas/UserSchema.js";

const BUCKET_SIZE = 100;

const SyncLeaderboard = async () => {
  const allUsers = await User.find({}, { points: 1 });

  const maxPoints = allUsers.reduce((max, u) => Math.max(max, u.points || 0), 0);
  const bucketCount = Math.ceil(maxPoints / BUCKET_SIZE);

  const histogram = Array.from({ length: bucketCount }, (_, i) => ({
    min: i * BUCKET_SIZE,
    max: (i + 1) * BUCKET_SIZE - 1,
    count: 0,
  }));

  allUsers.forEach(u => {
    let idx = Math.floor((u.points || 0) / BUCKET_SIZE);
    if (idx >= histogram.length) idx = histogram.length - 1;
    if (histogram[idx]) histogram[idx].count++;
  });


  const totalUsers = allUsers.length;
  const stats = { totalUsers, pointsHistogram: histogram, createdAt: new Date() };
  console.log("stats:", stats)
  await LeaderBoard.create(stats);

  await RedisClient.set("leaderboardStats", JSON.stringify(stats));
};

export { SyncLeaderboard };
