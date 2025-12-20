import TrialRunner from "../Schemas/TrialSchema.js"
import TestCase from "../Schemas/TestCaseSchema.js"; 
import RawExecution from "../Schemas/RawSchema.js"
import mongoose from "mongoose"

mongoose.set("debug", true);
const LogTrialResult = async (data) => {
  try {
    return await TrialRunner.create({
      _id: data.jobId,
      problemid: data.problemId,
      userId: data.userId,
      language: data.language,
      generatedCode: data.code,
      status: data.status,
      output: data.output,
      execution_time: data.duration_sec,
      socketId: data.socketId
    })
  } catch (err) {
    console.error("Trial log DB insert failed:", err)
    return null
  }
}

const LogTestCaseResult = async (data) => {
  console.log("Parsing test case data from Redis...");

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
console.log("code:",ref.orginalCode)

  try {
    await TestCase.create({
      _id: ref.jobId,
      userId: ref.userId,
      problemId: ref.problemId,
      language: ref.language,
      totalTestCases: total,
      status: "executed",
      testCases: formattedTestCases,
      passedNo:passedNo,
      code:ref.orginalCode
    });

    console.log("Created submission:", ref.jobId);
  } catch (err) {
    console.error("Error saving submission:", err);
  }
};



const LogRawExecution = async (data) => {
  try {
    return await RawExecution.create({
      _id: data.jobId,
      userId: data.userId,
      language: data.language,
      code: data.code,
      status: data.status,
      output: data.output,
      execution_time: data.duration_sec
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
