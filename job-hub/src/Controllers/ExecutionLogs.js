import TrialRunner from "../Schemas/TrialSchema.js"
import TestCase from "../Schemas/TestCaseSchema.js";
import RawExecution from "../Schemas/RawSchema.js"
import mongoose from "mongoose"
import { RedisClient } from "../Utils/RedisClient.js";

// mongoose.set("debug", true);
const LogTrialResult = async (data) => {
  console.log("cursor print data:", data)
  const key = `testPrint:tie:${data.userId}:${data.createdAt}`;

  try {
    const tie = await RedisClient.incr(key);
    console.log("createdAt:", data.createdAt, "usrId:", data.userId)
    let finalCreatedAt = data.createdAt
    if (tie > 1) {
      console.log("we hit the tie condition")
      finalCreatedAt = data.createdAt + (tie - 1) * 0.001;
    }
    const rest = await TrialRunner.create({
      _id: data.jobId,
      problemid: data.problemId,
      userId: data.userId,
      language: data.language,
      generatedCode: data.code,
      status: data.status,
      output: data.actualOutput,
      execution_time: data.duration,
      createdAt: data.createdAt,
      problemId: data.problemId,
      tie: tie
    })
    console.log("succesfully created testprint", rest)
  } catch (err) {
    console.log("fialed wile inserting cursorPrint 2 db", err)
  }
}

const LogTestCaseResult = async (data) => {

  const { total, testCases } = Object.entries(data).reduce(
    (acc, [field, value]) => {
      if (field === "total") acc.total = Number(value);
      else acc.testCases.push(JSON.parse(value));
      return acc;
    },
    { total: 0, testCases: [] }
  );

  if (!testCases.length) {
    console.warn("No test cases found, skipping DB save.");
    return;
  }

  console.log("Parsed test cases:", testCases);

  const ref = testCases[0];
  const submissionsKey = `submissions:${ref.userId}:${ref.problemId}`;
  await RedisClient.del(submissionsKey);
  const formattedTestCases = testCases.map((tc) => ({
    caseId: tc.testCaseId,
    testCaseNumber: tc.testCaseNumber,
    input: tc.input,
    expectedOutput: tc.expected,
    userOutput: tc.actualOutput,
    duration: tc.duration,
    isPassed: tc.passed,
    executedAt: new Date(tc.timestamp),
  }));

  const passedNo = formattedTestCases.filter(tc => tc.isPassed).length;
  console.log("code:", ref.orginalCode)
  const key = `rawexec:tie:${ref.userId}:${ref.createdAt}`;
  const tie = await RedisClient.incr(key)
  console.log("createdAt haai:", ref.createdAt)
  let finalCreatedAt = ref.createdAt
  if (tie > 1) {
    console.log("collision detected")
    finalCreatedAt = data.createdAt + (tie - 1) * 0.001;
  }
  try {
    await TestCase.create({
      _id: ref.jobId,
      userId: ref.userId,
      problemId: ref.problemId,
      language: ref.language,
      totalTestCases: total,
      status: passedNo === total ? "success" : "failed",
      testCases: formattedTestCases,
      passedNo: passedNo,
      code: ref.orginalCode,
      createdAt: finalCreatedAt,
      tie: tie
    });

    console.log("Created submission:", ref.jobId);
  } catch (err) {
    console.error("Error saving submission:", err);
  }

};

const LogRawExecution = async (data) => {
  console.log("language :", data.language)
  const key = `rawexec:tie:${data.userId}:${data.createdAt}`;
  try {
    console.log("result aayo hai vai")
    console.log("createdAt:", data.createdAt)
    const tie = await RedisClient.incr(key);
    let finalCreatedAt = data.createdAt
    if (tie > 1) {
      console.log("tie break conditon should be executed btw")
      finalCreatedAt = data.createdAt + (tie - 1) * 0.001;
    }
    await RawExecution.create({
      _id: data.jobId,
      userId: data.userId,
      language: data.language,
      code: data.code,
      status: data.status,
      output: data.output,
      execution_time: data.duration_sec,
      createdAt: finalCreatedAt,
      tie: tie, // Store the tie value from Redis (1-indexed: 1, 2, 3, ...)
    })
  } catch (err) {
    console.error("Raw execution DB insert failed:", err)
    return null
  }

}

export {
  LogRawExecution,
  LogTrialResult,
  LogTestCaseResult
}
