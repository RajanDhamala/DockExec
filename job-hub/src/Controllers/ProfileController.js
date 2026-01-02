import asyncHandler from "../Utils/AsyncHandler.js";
import RawExecution from "../Schemas/RawSchema.js"
import TrialRunner from "../Schemas/TrialSchema.js"
import ApiError from "../Utils/ApiError.js";
import ApiResponse from "../Utils/ApiResponse.js";
import User from "../Schemas/UserSchema.js"
import TestCase from "../Schemas/TestCaseSchema.js"
import RecentActivity from "../Schemas/RecentActivitySchema.js"
import mongoose from "mongoose";
import pushrecentactivity from "../Utils/UtilsRecentActivity.js"

import { hashPassword, verifyPassword } from "../Utils/Authutils.js"


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

const getRecentActivity = asyncHandler(async (req, res) => {
  const user = req.user

  let userActivity = await RecentActivity.findOne(
    { userId: user.id },
    {
      MetaData: { $slice: -5 }
    }
  );

  if (!userActivity) {
    userActivity = await RecentActivity.create({
      userId: user.id
    })
    throw new ApiError(400, null, "logs not found")
  }
  return res.send(new ApiResponse(200, "succesfully fetched activity data", userActivity))
})

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
  const { runId } = req.params

  if (!runId) {
    throw new ApiError(400, null, "please include id of execution")
  }
  const getExecutionData = await TestCase.find({ _id: runId, userId: user.id })
  if (!getExecutionData) throw new ApiError(400, null, "exection metadata not found")
  const activity = {
    title: `Rerunning the Submisson`,
    description: "re execution " + runId,
    status: "success",
    browserMeta: {}
  };

  await pushrecentactivity(user.id, activity);
  return res.send(new ApiResponse(200, "successfully executed oldSubmission", getExecutionData))
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
        problemDescription: test.problemId?.description || "", // ← add this
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

    // Take duration from the first test case only
    if (test.testCases && test.testCases.length > 0) {
      summary.totalDuration += test.testCases[0].duration || 0;
    }

    // Keep track of the latest run
    if (!summary.lastRun || new Date(test.createdAt) > new Date(summary.lastRun)) {
      summary.lastRun = test.createdAt;
    }
  });

  // Convert object to array and calculate success rate / avg duration
  const result = Object.values(summaryByProblem).map(s => ({
    problemId: s.problemId,
    problemTitle: s.problemTitle,
    problemDescription: s.problemDescription, // ← now filled
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
    .sort({ createdAt: -1 })//latest
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

  // const result = "hello"
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
  const user = req.user;

  const printData = await TrialRunner.find({ userId: user.id })
    .select("_id status output execution_time language problemid createdAt")
    .populate({
      path: "problemid",
      select: "_id title"
    })
    .lean();

  if (!printData || printData.length === 0) {
    throw new ApiError(404, null, "user print data not found");
  }

  return res.send(
    new ApiResponse(200, "fetched print results", printData)
  );
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
    .sort({ createdAt: -1 }) // latest first
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
  const { problemId, runId } = req.pramas
  if (!problemId || !runId) {
    throw new ApiError(400, null, "please inlcude the problemId and runId in req")
  }
  const currentData = await TrialRunner.findOne({ _id: runId, userId: user.id })
  if (!currentData) {
    throw new ApiError(400, null, "no runLog wtih given id found")
  }
  return res.send(new ApiResponse(200, "successfully rerunning the prints"))
})

const DeletePrints = asyncHandler(async (req, res) => {
  const user = req.user
  const { runId } = req.params
  if (!runId) {
    throw new ApiError(400, null, "please inlcude the problemId and runId in req")
  }
  const currentData = await TrialRunner.findOneAndDelete({ _id: runId, userId: user.id })
  // let currentData = "hello"
  if (!currentData) {
    throw new ApiError(400, null, "no runLog wtih given id found")
  }
  return res.send(new ApiResponse(200, "successfully delted prints"))
})


const ProgrammizExecutions = asyncHandler(async (req, res) => {
  const user = req.user;
  const programmizData = await RawExecution.find({ userId: user.id }).select("execution_time language status output createdAt _id")
  if (!programmizData) {
    throw new ApiError(400, null, 'user has no programmiz reuslts')
  }
  return res.send(new ApiResponse(200, 'successfully fethed programmiz results', programmizData))
})

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
  const { runId } = req.params
  if (!runId) {
    throw new ApiError(400, null, "please inlcude runID in req")
  }
  const dbdata = await RawExecution.findOne({ _id: runId, userId: user.id }).select("language code createdAt")
  if (!dbdata) {
    throw new ApiError(500, null, "execution data not found")
  }
  return res.send(new ApiResponse(200, "successfully re runned execution", dbdata))
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
