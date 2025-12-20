import asyncHandler from "../Utils/AsyncHandler.js";
import Problem from "../Schemas/CodeSchema.js"
import ApiError from "../Utils/ApiError.js";
import ApiResponse from "../Utils/ApiResponse.js";
import { producer } from "../Utils/KafkaProvider.js";
import { v4 as uuidv4 } from 'uuid';
import { RedisClient } from "../Utils/RedisClient.js"

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


const RunCode = asyncHandler(async (req, res) => {
  const { code, language, problemId, socketId } = req.body;
  const { type } = req.params;
  const uuid = uuidv4();

  if (!code || !language || !type || !problemId || !socketId) {
    throw new ApiError(400, 'please include type, language, code, type, and problemId in request');
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
  const testCaseToSend = type === "run" ? problemData.testCases[0] : problemData.testCases;

  await producer.send({
    topic: type === "submit" ? "test_code" : "Runs_code",
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
  console.log("code produced for running", type)
  return res.send(new ApiResponse(200, 'code sent for running', type === "submit" ? uuid : problemData));
});

export {
  RunCode, getList, GetData
}
