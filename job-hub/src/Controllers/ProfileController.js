import asyncHandler from "../Utils/AsyncHandler.js";
import { TokenCounter, IncreaseToken } from "../Utils/TokenCounter.js"
import RawExecution from "../Schemas/RawSchema.js"
import TrialRunner from "../Schemas/TrialSchema.js"
import ApiError from "../Utils/ApiError.js";
import ApiResponse from "../Utils/ApiResponse.js";
import User from "../Schemas/UserSchema.js"
import TestCase from "../Schemas/TestCaseSchema.js"
import RecentActivity from "../Schemas/RecentActivitySchema.js"
import mongoose from "mongoose";
import pushrecentactivity from "../Utils/UtilsRecentActivity.js"
import { producer } from "../Utils/KafkaProvider.js";
import { v4 as uuidv4 } from 'uuid';
import { RedisClient } from "../Utils/RedisClient.js"
import Problem from "../Schemas/CodeSchema.js"
import { hashPassword, verifyPassword } from "../Utils/Authutils.js"
import { getRabbit, RabbitChannel } from "../Utils/ConnectRabbit.js";


const RabbitClient = getRabbit()

const GetProfile = asyncHandler(async (req, res) => {
  const user = req.user;

  try {
    const userProfile = await User.findOne({ _id: user.id }).select("avatar fullname email _id points bio dob")
    if (!userProfile) {
      throw new ApiError(400, null, "user not found")
    }
    return res.send(new ApiResponse(200, "fetched user profile from db", userProfile))
  } catch (error) {
    throw new ApiError(500, null, "internal server error")
  }
})

const REDIS_CACHE_LIMIT = 20;
const UI_LIMIT = 5;
const CACHE_TTL = 6 * 60 * 60;

const getRecentActivity = asyncHandler(async (req, res) => {
  const user = req.user;
  const key = `user:activity:${user.id}`;

  try {
    // 1️⃣ Redis first
    const cachedLogs = await RedisClient.lRange(key, 0, UI_LIMIT - 1);
    console.log("cachedLogs:", cachedLogs);

    if (cachedLogs.length > 0) {
      return res.status(200).json(
        new ApiResponse(200, "Fetched from cache", {
          userId: user.id,
          MetaData: cachedLogs.map(JSON.parse)
        })
      );
    }

    let activityDoc = await RecentActivity.findOne({ userId: user.id }).lean();

    if (!activityDoc) {
      activityDoc = await RecentActivity.create({
        userId: user.id,
        MetaData: []
      });

      return res.status(200).json(
        new ApiResponse(200, "No activity logs yet", {
          userId: user.id,
          MetaData: []
        })
      );
    }

    const meta = Array.isArray(activityDoc.MetaData)
      ? activityDoc.MetaData
      : [];

    const sortedMeta = meta
      .slice()
      .sort((a, b) => new Date(b.atTime) - new Date(a.atTime));

    const uiMeta = sortedMeta.slice(0, UI_LIMIT);

    if (sortedMeta.length > 0) {
      const itemsToCache = sortedMeta.map(m => JSON.stringify(m));

      await RedisClient
        .multi()
        .lPush(key, itemsToCache)
        .lTrim(key, 0, REDIS_CACHE_LIMIT - 1)
        .expire(key, CACHE_TTL)
        .exec();
    }

    return res.status(200).json(
      new ApiResponse(200, "Fetched activity successfully", {
        userId: user.id,
        MetaData: uiMeta
      })
    );

  } catch (err) {
    console.error("Error fetching recent activity:", err);
    return res
      .status(500)
      .json(new ApiResponse(500, "Failed to fetch activity data", null));
  }
});



const ChangePassword = asyncHandler(async (req, res) => {
  const user = req.user
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, null, "include old and new passwod in req")
  }

  const isUser = await User.findOne({ _id: user.id }).select("password")
  const isPasswordValid = await verifyPassword(currentPassword, isUser.password);

  if (!isPasswordValid) {
    throw new ApiError(400, "invalid credentials")
  }

  const hashedPassword = await hashPassword(newPassword);
  isUser.password = hashedPassword
  await isUser.save()
  const activity = {
    title: `password changed`,
    description: "login password changed",
    status: "success",
    browserMeta: {}
  };

  await pushrecentactivity(user._id, activity);

  return res.send(new ApiResponse(200, "user password changed successfully"))
})


const RecentExecutions = asyncHandler(async (req, res) => {
  const user = req.user;

  const recentExe = await TestCase.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(user.id)
      }
    },
    { $sort: { createdAt: -1 } },
    { $limit: 8 },

    {
      $lookup: {
        from: "problems",
        localField: "problemId",
        foreignField: "_id",
        as: "problem"
      }
    },

    {
      $unwind: {
        path: "$problem",
        preserveNullAndEmptyArrays: true
      }
    },

    {
      $project: {
        createdAt: 1,
        status: 1,
        language: 1,
        totalTestCases: 1,
        passedNo: 1,
        firstTestCaseDuration: {
          $arrayElemAt: ["$testCases.duration", 0]
        },

        problemId: 1,
        name: "$problem.title", // or name
      }
    }
  ]);

  if (!recentExe || recentExe.length === 0) {
    throw new ApiError(400, null, "no recent executions found");
  }

  return res.send(
    new ApiResponse(200, "fetched recent executions", recentExe)
  );
});

const ViewRecentExecutionsDetail = asyncHandler(async (req, res) => {
  const user = req.user
  const { exeId } = req.params

  if (!exeId) {
    throw new ApiError(400, null, "plese add execution id in req")
  }
  const Viewdata = await TestCase.findOne({ userId: user.id, _id: exeId }).select("language _id status code testCases createdAt")
  if (!Viewdata) {
    throw new ApiError(400, null, "not found")
  }
  return res.send(new ApiResponse(200, "successfully fetched recent executionDetials", Viewdata))
})

const reRunRecentExecutions = asyncHandler(async (req, res) => {
  const user = req.user
  const { runId, socketId } = req.params

  if (!runId || !socketId) {
    throw new ApiError(400, null, "please include id of execution")
  }
  const getExecutionData = await TestCase.find({ _id: runId, userId: user.id })
  const code = getExecutionData[0].code

  const language = getExecutionData[0].language
  let tokenLength
  try {
    const tokenResult = await TokenCounter({ code, language }, user.id);
    if (tokenResult.message) {
      return res.send(new ApiResponse(402, null, tokenResult.message));
    }
    tokenLength = tokenResult.tokenCount;
  } catch (err) {
    console.error(err);
    return res.send(new ApiResponse(500, null, "Token validation failed"));
  }

  const problemId = getExecutionData[0].problemId
  console.log("get exe", getExecutionData)
  if (!getExecutionData) throw new ApiError(400, null, "exection metadata not found")

  const uuid = uuidv4();

  const ProblemKey = `problem:${problemId}`;
  let problemData;

  try {
    console.log("probleid", problemId)
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
    if (!problemData) throw new ApiError(404, 'Problem not found 2');
    await RedisClient.set(ProblemKey, JSON.stringify(problemData), { EX: 120 });
  }
  // Produce execution job
  const testCaseToSend = problemData.testCases;
  const submissionsKey = `submissions:${req.user.id}:${problemData._id}`;
  await RedisClient.del(submissionsKey);

  const message = {
    code,
    language,
    id: uuid,
    testCase: testCaseToSend,
    socketId,
    userId: req.user.id,
    problemId: problemData._id,
    function_name: problemData.function_name,
    parameters: problemData.parameters,
    wrapper_type: problemData.wrapper_type,
    type: "rerun"
  };

  await RabbitChannel.publish(
    "code_exchange",
    "all_cases_submission",
    Buffer.from(JSON.stringify(message)),
    { persistent: true }
  );
  await IncreaseToken(user.id, tokenLength, req.route.path)
  console.log("code produced for running")
  return res.send(new ApiResponse(200, "successfully executed oldSubmission", uuid))
})


const LogRecentExecutionsDetail = asyncHandler(async (req, res) => {
  const user = req.user
  const { exeId } = req.params
  if (!exeId) throw new ApiError(400, null, "please include execution Id in request")
  const data = await TestCase.find({ _id: exeId, userId: user.id })

  if (!data) throw new ApiError(400, null, "exection metadata not found")

  return res.send(new ApiResponse(200, "successfully executed oldSubmission", data))
})

const DelRecentExecution = asyncHandler(async (req, res) => {
  const user = req.user
  const { exeId } = req.params;

  if (!exeId) throw new ApiError(400, null, "please include execution Id in request")

  const result = await TestCase.deleteOne({
    userId: user.id,
    _id: exeId
  });
  return res.send(
    new ApiResponse(
      200,
      "success",
      {
        deletedCount: result.deletedCount
      }
    )
  );
})

const AvgTestCaseStats = asyncHandler(async (req, res) => {
  const user = req.user;

  const allTests = await TestCase.find({ userId: user.id })
    .select("problemId testCases totalTestCases passedNo createdAt")
    .populate({ path: "problemId", select: "_id title description" })
    .lean();

  const summaryByProblem = {};

  allTests.forEach(test => {
    const problemKey = test.problemId?._id || "unknown";

    if (!summaryByProblem[problemKey]) {
      summaryByProblem[problemKey] = {
        problemId: problemKey,
        problemTitle: test.problemId?.title || "Unknown Problem",
        problemDescription: test.problemId?.description || "",
        totalAttempts: 0,
        totalPassed: 0,
        totalCases: 0,
        totalDuration: 0,
        lastRun: null
      };
    }

    const summary = summaryByProblem[problemKey];
    summary.totalAttempts += 1;
    summary.totalPassed += test.passedNo || 0;
    summary.totalCases += test.totalTestCases || 0;

    if (test.testCases && test.testCases.length > 0) {
      summary.totalDuration += test.testCases[0].duration || 0;
    }

    if (!summary.lastRun || new Date(test.createdAt) > new Date(summary.lastRun)) {
      summary.lastRun = test.createdAt;
    }
  });

  const result = Object.values(summaryByProblem).map(s => ({
    problemId: s.problemId,
    problemTitle: s.problemTitle,
    problemDescription: s.problemDescription,
    totalAttempts: s.totalAttempts,
    successRate: s.totalCases ? ((s.totalPassed / s.totalCases) * 100).toFixed(1) + "%" : "0%",
    avgDuration: s.totalAttempts ? (s.totalDuration / s.totalAttempts).toFixed(1) + "s" : "-",
    lastRun: new Date(s.lastRun).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }));

  console.log(result);
  return res.send(new ApiResponse(200, 'success', result));
})

const viewAvgTestLogs = asyncHandler(async (req, res) => {
  const user = req.user
  const { problemId } = req.params
  console.log("params:", req.params)
  if (!problemId) throw new ApiError(400, null, "please icnlude problem id in re")
  const data = await TestCase.find({ userId: user.id, problemId: problemId }).select("createdAt language totalTestCases status passedNo code")
    .sort({ createdAt: -1 })
    .limit(6)
    .populate({
      path: "problemId",
      select: "title _id"
    })

  if (!data) {
    throw new ApiError(400, null, "no problem logs found")
  }
  console.log("data:", data)
  return res.send(new ApiResponse(400, "fetched logs successfully", data))
})

const DeleteAvgTestStats = asyncHandler(async (req, res) => {
  const user = req.user;
  const { problemId } = req.params;

  if (!problemId) {
    throw new ApiError(400, null, "please add problemId in request params");
  }

  const result = await TestCase.deleteMany({
    userId: user.id,
    problemId: problemId
  });

  return res.send(
    new ApiResponse(
      200,
      "success",
      {
        deletedCount: result.deletedCount
      }
    )
  );
});


const RecentPrintRuns = asyncHandler(async (req, res) => {
  const user = req.user
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 7;
  const skip = (page - 1) * limit;

  const totalItems = await TrialRunner.countDocuments({ userId: user.id });

  const printData = await TrialRunner.find({ userId: user.id })
    .select("_id status output execution_time language problemid createdAt")
    .populate({ path: "problemid", select: "_id title" })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalPages = Math.ceil(totalItems / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return res.send({
    status: 200,
    message: "fetched print results",
    data: printData,
    pagination: {
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage,
      totalItems
    }
  });
});

const viewRecentPrintsOutput = asyncHandler(async (req, res) => {
  const user = req.user;
  const { problemId } = req.params;

  if (!problemId) {
    throw new ApiError(400, null, "please include problem id in req");
  }

  const data = await TrialRunner.find({
    userId: user.id,
    _id: problemId,
  })
    .select("language status generatedCode createdAt output execution_time problemid")
    .populate({
      path: "problemid",
      select: "_id title",
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  if (data.length === 0) {
    throw new ApiError(404, null, "no problem logs found");
  }

  return res.send(
    new ApiResponse(200, "fetched logs successfully", data)
  );
});

const reRunRecentPrints = asyncHandler(async (req, res) => {
  const user = req.user
  const { runId, socketId } = req.params
  if (!socketId || !runId) {
    throw new ApiError(400, null, "please inlcude the problemId and runId in req")
  }
  const currentData = await TrialRunner.findOne({ _id: runId, userId: user.id })
  if (!currentData) {
    throw new ApiError(400, null, "no runLog wtih given id found")
  }
  const code = currentData.generatedCode
  const language = currentData.language
  const problemId = currentData._id
  const uuid = uuidv4();
  let tokenLength

  try {
    const tokenResult = await TokenCounter({ code, language }, user.id);
    if (tokenResult.message) {
      return res.send(new ApiResponse(402, null, tokenResult.message));
    }
    tokenLength = tokenResult.tokenCount;
    console.log("token length:", tokenLength)
  } catch (err) {
    console.error(err);
    return res.send(new ApiResponse(500, null, "Token validation failed"));
  }

  console.log(req.body)

  if (!code || !language || !problemId) {
    throw new ApiError(400, 'please include type, language, code,  and problemId in request');
  }
  const message = {
    code,
    language,
    id: uuid,
    socketId,
    userId: req.user.id,
    problemId: problemId,
    type: "rerun"
  }
  await RabbitChannel.publish("reRun_printCase", Buffer.from(JSON.stringify(message)))

  await IncreaseToken(user.id, tokenLength, req.route.path)
  return res.send(new ApiResponse(200, 'code sent for running', { uuid }));
})

const DeletePrints = asyncHandler(async (req, res) => {
  const user = req.user
  const { runId } = req.params
  if (!runId) {
    throw new ApiError(400, null, "please inlcude the problemId and runId in req")
  }
  const currentData = await TrialRunner.findOneAndDelete({ _id: runId, userId: user.id })
  if (!currentData) {
    throw new ApiError(400, null, "no runLog wtih given id found")
  }
  return res.send(new ApiResponse(200, "successfully delted prints"))
})






const ProgrammizExecutions = asyncHandler(async (req, res) => {
  const user = req.user;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  const totalItems = await RawExecution.countDocuments({ userId: user.id });

  const programmizData = await RawExecution.find({ userId: user.id })
    .select("execution_time language status output createdAt _id")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  if (!programmizData.length) {
    throw new ApiError(404, null, 'user has no programmiz results');
  }

  const totalPages = Math.ceil(totalItems / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return res.send({
    status: 200,
    message: 'successfully fetched programmiz results',
    data: programmizData,
    pagination: {
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage,
      totalItems
    }
  });
});

const viewProgrammizLogs = asyncHandler(async (req, res) => {
  const user = req.user
  const { runId } = req.params

  if (!runId) {
    throw new ApiError(400, null, "please include the runId in req")
  }
  const data = await RawExecution.findOne({ _id: runId, userId: user.id }).select("language code execution_time status output createdAt")
  if (!data) {
    throw new ApiError(400, null, "raw execution not found")
  }
  return res.send(new ApiResponse(200, "fetched programmiz logs", data))
})


const reRunPorgrammiz = asyncHandler(async (req, res) => {
  const user = req.user
  const { runId, socketId } = req.params
  if (!runId || !socketId) {
    throw new ApiError(400, null, "please inlcude runID in req")
  }
  const dbdata = await RawExecution.findOne({ _id: runId, userId: user.id }).select("language code createdAt")
  if (!dbdata) {
    throw new ApiError(500, null, "execution data not found")
  }
  const code = dbdata.code
  const language = dbdata.language
  let tokenLength
  try {
    const tokenResult = await TokenCounter({ code, language }, user.id);
    if (tokenResult.message) {
      return res.send(new ApiResponse(402, null, tokenResult.message));
    }
    tokenLength = tokenResult.tokenCount;
  } catch (err) {
    console.error(err);
    return res.send(new ApiResponse(500, null, "Token validation failed"));
  }

  const uuid = uuidv4()
  try {
    const message = {
      code,
      language,
      id: uuid,
      socketId,
      userId: req.user.id,
      type: "rerun"
    };

    await RabbitChannel.publish(
      "code_exchange",
      "programiz_submission",
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
    console.log("Job produced successfully");
    await IncreaseToken(user.id, tokenLength, req.route.path)
  } catch (error) {
    console.log("Failed to produce job:", error);
    throw new ApiError(400, "Failed to produce job for code execution");
  }
  return res.send(new ApiResponse(200, "successfully re runned execution", uuid))

})

const DeleteProgrammiz = asyncHandler(async (req, res) => {
  const user = req.user
  const { runId } = req.params
  if (!runId) {
    throw new ApiError(400, null, "execution id is not found in req")
  }
  const dbData = await RawExecution.findOneAndDelete({ _id: runId, userId: user.id })
  // const dbData = "hello"
  if (!dbData) {
    throw new ApiError(500, null, "execution not found or requires permission")
  }
  return res.send(new ApiResponse(200, "successfully deleted programmiz id", dbData))
})


export {
  GetProfile, getRecentActivity, ChangePassword,
  RecentExecutions, ViewRecentExecutionsDetail, LogRecentExecutionsDetail, DelRecentExecution,
  AvgTestCaseStats, viewRecentPrintsOutput, DeletePrints, viewAvgTestLogs, DeleteAvgTestStats,
  RecentPrintRuns, reRunRecentPrints, ProgrammizExecutions, viewProgrammizLogs, reRunPorgrammiz,
  DeleteProgrammiz, reRunRecentExecutions
}
