import asyncHandler from "../Utils/AsyncHandler.js";
import RawExecution from "../Schemas/RawSchema.js"
import TrialRunner from "../Schemas/TrialSchema.js"
import ApiError from "../Utils/ApiError.js";
import ApiResponse from "../Utils/ApiResponse.js";
import User from "../Schemas/UserSchema.js"
import { hashPassword } from "../Utils/Authutils.js";
import TestCase from "../Schemas/TestCaseSchema.js"
import mongoose from "mongoose";

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


const ChangePassword = asyncHandler(async (req, res) => {
  const user = req.user
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, null, "include old and new passwod in req")
  }

  const isUser = await User.findOne({ _id: user.id }).select("passwod")
  const isPasswordValid = await verifyPassword(currentPassword, isUser.password);

  if (!isPasswordValid) {
    throw new ApiError(400, "invalid credentials")
  }

  const hashedPassword = await hashPassword(newPassword);
  isUser.password = hashedPassword
  await isUser.save()

  return res.send(new ApiResponse(200, "user password changed successfully"))
})


const RecentExecutions = asyncHandler(async (req, res) => {
  const user = req.user

  const recentExe = await TestCase.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(user.id)
      }
    },
    { $sort: { createdAt: -1 } },
    { $limit: 8 },
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
        problemId: 1
      }
    }
  ]);
  if (!recentExe) {
    throw new ApiError(400, null, 'no recent executions found')
  }
  return res.send(new ApiResponse(200, 'fetched recent executions', recentExe))
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


const ProgrammizExecutions = asyncHandler(async (req, res) => {
  const user = req.user;
  const programmizData = await RawExecution.find({ userId: user.id }).select("execution_time language status output createdAt _id")
  if (!programmizData) {
    throw new ApiError(400, null, 'user has no programmiz reuslts')
  }
  return res.send(new ApiResponse(200, 'successfully fethed programmiz results', programmizData))
})



export { GetProfile, ChangePassword, RecentExecutions, AvgTestCaseStats, DeleteAvgTestStats, RecentPrintRuns, ProgrammizExecutions }
