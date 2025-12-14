import { RedisClient } from "./RedisClient.js";
import { UpdatePoints } from "../Controllers/UserController.js"; 
const save2Redis=async(data)=>{
    const key=`job:${data.jobId}`;

    await RedisClient.hSet(
        key,
        data.testCaseNumber.toString(),
        JSON.stringify(data)
    )

await RedisClient.hSet(key, "total", data.totalTestCases.toString());
await RedisClient.expire(key, 30);
}

const saveTest2db = async (data) => {
  // Parse all fields
  const { total, testCases } = Object.entries(data).reduce(
    (acc, [field, value]) => {
      if (field === "total") {
        acc.total = Number(value);
      } else {
        acc.testCases.push(JSON.parse(value));
      }
      return acc;
    },
    { total: 0, testCases: [] }
  );

  // Check failed test cases
  const failed = testCases.filter(tc => !tc.passed);

  if (failed.length === 0) {
    console.log(" All test cases passed!");
    const { userId, problemId } = testCases[0];
    await UpdatePoints(userId, problemId);
  } else {
    console.log(` ${failed.length} test cases failed:`);
    failed.forEach(tc =>
      console.log(`- Test ${tc.testCaseNumber}: expected ${tc.expected}, got ${tc.actualOutput}`)
    );
  }

};



export {save2Redis,saveTest2db}