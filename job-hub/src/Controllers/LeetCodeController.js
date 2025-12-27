import asyncHandler from "../Utils/AsyncHandler.js";
import Problem from "../Schemas/CodeSchema.js"
import ApiError from "../Utils/ApiError.js";
import ApiResponse from "../Utils/ApiResponse.js";
import { producer } from "../Utils/KafkaProvider.js";
import { v4 as uuidv4 } from 'uuid';
import { RedisClient } from "../Utils/RedisClient.js"
import TestCase from "../Schemas/TestCaseSchema.js";
import UserCodeDraft from "../Schemas/UserCodeDraft.js";

const getList = asyncHandler(async (req, res) => {
  const listKey = "getList";
  try {
    const cached = await RedisClient.get(listKey);
    if (cached) {
      const data = JSON.parse(cached);
      return res.send(new ApiResponse(200, 'Fetched problem list from Redis', data));
    }
  } catch (error) {
    console.log("Redis error:", error);
  }
  const list = await Problem.find().select("title");

  try {
    await RedisClient.set(listKey, JSON.stringify(list), { EX: 120 });
  } catch (error) {
    console.log("Failed to cache list in Redis:", error);
  }

  return res.send(new ApiResponse(200, 'Fetched problem list from DB', list));
});

const GetData = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, 'please add the id in req');

  const ProblemKey = `problem:${id}`;
  let CodeData;

  try {
    const cached = await RedisClient.get(ProblemKey);
    if (cached) {
      CodeData = JSON.parse(cached);
      return res.send(new ApiResponse(200, 'fetched problem data from redis', CodeData));
    }
  } catch {
    console.log("Cache missed, hitting DB");
  }
  CodeData = await Problem.findById(id);
  if (!CodeData) throw new ApiError(400, 'invalid problem id');

  await RedisClient.set(ProblemKey, JSON.stringify(CodeData), { EX: 120 });
  return res.send(new ApiResponse(200, 'fetched problem data from db', CodeData));
});


const TestPrintCode = asyncHandler(async (req, res) => {
  const { code, language, problemId, socketId } = req.body;
  const uuid = uuidv4();
  console.log(req.body)

  if (!code || !language || !problemId || !socketId) {
    throw new ApiError(400, 'please include type, language, code,  and problemId in request');
  }

  const ProblemKey = `problem:${problemId}`;
  let problemData;

  try {
    const cached = await RedisClient.get(ProblemKey);
    if (cached) {
      problemData = JSON.parse(cached);
      console.log("problem cached found btw")
    }
    else {
      problemData = await Problem.findById(problemId);
      if (!problemData) throw new ApiError(404, 'Problem not found');
      await RedisClient.set(ProblemKey, JSON.stringify(problemData), { EX: 120 });
    }
  } catch {
    problemData = await Problem.findById(problemId);
    if (!problemData) throw new ApiError(404, 'Problem not found');
    await RedisClient.set(ProblemKey, JSON.stringify(problemData), { EX: 120 });
  }

  // Produce execution job
  const testCaseToSend = problemData.testCases[0]

  await producer.send({
    topic: "print_test_submission",
    messages: [{
      value: JSON.stringify({
        code,
        language,
        id: uuid,
        testCase: testCaseToSend,
        socketId,
        userId: req.user.id,
        problemId: problemData._id,
        function_name: problemData.function_name,
        parameters: problemData.parameters,
        wrapper_type: problemData.wrapper_type
      })
    }]

  });
  console.log("code produced for running")
  return res.send(new ApiResponse(200, 'code sent for running', { uuid, problemData }));
});


const AllTestCases = asyncHandler(async (req, res) => {
  const { code, language, problemId, socketId } = req.body;
  const uuid = uuidv4();

  if (!code || !language || !problemId || !socketId) {
    throw new ApiError(400, 'please include  language, code and problemId in request');
  }

  const ProblemKey = `problem:${problemId}`;
  let problemData;

  try {
    const cached = await RedisClient.get(ProblemKey);
    if (cached) {
      problemData = JSON.parse(cached);
      console.log("problem cached found btw")
    }
    else {
      problemData = await Problem.findById(problemId);
      if (!problemData) throw new ApiError(404, 'Problem not found');
      await RedisClient.set(ProblemKey, JSON.stringify(problemData), { EX: 120 });
    }
  } catch {
    problemData = await Problem.findById(problemId);
    if (!problemData) throw new ApiError(404, 'Problem not found');
    await RedisClient.set(ProblemKey, JSON.stringify(problemData), { EX: 120 });
  }

  // Produce execution job
  const testCaseToSend = problemData.testCases;
  const submissionsKey = `submissions:${req.user.id}:${problemData._id}`;
  await RedisClient.del(submissionsKey);
  await producer.send({
    topic: "all_cases_submission",
    messages: [{

      value: JSON.stringify({
        code,
        language,
        id: uuid,
        testCase: testCaseToSend,
        socketId,
        userId: req.user.id,
        problemId: problemData._id,
        function_name: problemData.function_name,
        parameters: problemData.parameters,
        wrapper_type: problemData.wrapper_type
      })
    }]

  });
  console.log("code produced for running")
  return res.send(new ApiResponse(200, 'code sent for running', uuid));
});


const GetSubmissons = asyncHandler(async (req, res) => {
  const { problemId } = req.params;
  const userId = req.user.id;
  console.log("params:", req.params," userId:",req.user)
  let submissions;
  if (!problemId) {
    throw new ApiError(400, 'please provide problemId in request params');
  }
  const submissionsKey = `submissions:${userId}:${problemId}`;

  try {
    const cached = await RedisClient.get(submissionsKey);
    if (cached) {
      submissions = JSON.parse(cached);
      return res.send(new ApiResponse(200, 'fetched submissions from redis', submissions));
    }

  } catch (Err) {
    console.log("data not found on redis btw")
  }
  submissions = await TestCase.find({ "userId":userId, problemId }).sort({ createdAt: -1 }).limit(10).select("problemId language createdAt totalTestCases status passedNo");
  await RedisClient.set(submissionsKey, JSON.stringify(submissions), { EX: 120 });


  return res.send(new ApiResponse(200, 'fetched submissions data', submissions));
})

const GetTestCode = asyncHandler(async (req, res) => {
  const { testCaseId, problemId } = req.params;
  console.log(req.params)
  if (!testCaseId || !problemId) {
    throw new ApiError(400, 'please provide testCaseId and problemId in request params');
  }
  const data = await TestCase.findOne({ _id: testCaseId, problemId }).select("code language");

  return res.send(new ApiResponse(200, 'fetched test case code', data));

});

// Save or update user's draft code for a problem/language
const SaveDraftCode = asyncHandler(async (req, res) => {
  const { problemId, language, code } = req.body;
  const userId = req.user.id;

  if (!problemId || !language) {
    throw new ApiError(400, 'please provide problemId and language in request body');
  }

  const draft = await UserCodeDraft.findOneAndUpdate(
    { userId, problemId, language },
    { code: code || "" },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res.send(new ApiResponse(200, 'saved code draft', { id: draft._id }));
});

export {
  TestPrintCode, getList, GetData, GetSubmissons, AllTestCases, GetTestCode, SaveDraftCode
}
