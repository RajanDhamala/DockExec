import mongoose from "mongoose";
import CursorRawExecution from "../Schemas/ProgrammizCursor.js"
import { RedisClient } from "../Utils/RedisClient.js";
import asyncHandler from "../Utils/AsyncHandler.js";
import ApiError from "../Utils/ApiError.js";
import ApiResponse from "../Utils/ApiResponse.js";
import PrintCursor from "../Schemas/PrintCursorSchema.js"
import CursorTestCases from "../Schemas/TestCasesCursorSchema.js"

const createCursorProgrammiz = async (data) => {
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
    await CursorRawExecution.create({
      _id: data.jobId,
      userId: data.userId,
      language: data.language,
      code: data.code,
      status: data.status,
      output: data.output,
      execution_time: data.duration_sec,
      createdAt: finalCreatedAt,
      tie: tie,
    })

  } catch (err) {
    console.error("Raw execution DB insert failed:", err)
    return null
  }
}

const PAGE_LIMIT_DEFAULT = 4;

const getCursorProgrammiz = asyncHandler(async (req, res) => {
  const { pageLimit, cursorCreatedAt, cursorTie } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const limit = parseInt(pageLimit, 10) || PAGE_LIMIT_DEFAULT;

  const isInitialFetch =
    cursorCreatedAt == "init" && cursorTie == "init";

  const userIdObj = new mongoose.Types.ObjectId(userId);
  const query = { userId: userIdObj };

  if (!isInitialFetch) {
    const createdAtDate = new Date(cursorCreatedAt);
    const tieNum = Number(cursorTie);

    if (!isNaN(createdAtDate.getTime()) && !isNaN(tieNum)) {
      query.$or = [
        { userId: userIdObj, createdAt: { $lt: createdAtDate } },
        { userId: userIdObj, createdAt: createdAtDate, tie: { $lt: tieNum } },
      ];
    }
  }

  const docs = await CursorRawExecution.find(query)
    .sort({ createdAt: -1, tie: -1 })
    .limit(limit);

  let nextCursor = null;

  if (docs.length === limit) {
    const lastDoc = docs[docs.length - 1];
    nextCursor = {
      cursorCreatedAt: lastDoc.createdAt.toISOString(),
      cursorTie: lastDoc.tie,
    };
  }

  res.json({
    data: docs,
    nextCursor,
  });
});


const createCursorPrint = async (data) => {
  console.log("cursor print data:", data)
  const key = `rawexec:tie:${data.userId}:${data.createdAt}`;
  try {
    const tie = await RedisClient.incr(key);
    let finalCreatedAt = data.createdAt
    if (tie > 1) {
      console.log("we hit the tie condition")
      finalCreatedAt = data.createdAt + (tie - 1) * 0.001;
    }
    await PrintCursor.create({
      _id: data.jobId,
      problemid: data.problemId,
      userId: data.userId,
      language: data.language,
      generatedCode: data.code,
      status: data.status,
      output: data.actualOutput,
      execution_time: data.duration,
      createdAt: data.createdAt,
      tie: tie
    })
  } catch (err) {
    console.log("fialed wile inserting cursorPrint 2 db")
  }
}

const getCursorPrint = asyncHandler(async (req, res) => {
  const { pageLimit, cursorCreatedAt, cursorTie } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const limit = parseInt(pageLimit, 10) || PAGE_LIMIT_DEFAULT;

  const isInitialFetch =
    cursorCreatedAt == "init" && cursorTie == "init";

  const userIdObj = new mongoose.Types.ObjectId(userId);
  const query = { userId: userIdObj };
  if (!isInitialFetch) {
    const createdAtDate = new Date(cursorCreatedAt);
    const tieNum = Number(cursorTie);

    if (!isNaN(createdAtDate.getTime()) && !isNaN(tieNum)) {
      query.$or = [
        { userId: userIdObj, createdAt: { $lt: createdAtDate } },
        { userId: userIdObj, createdAt: createdAtDate, tie: { $lt: tieNum } },
      ];
    }
  }
  const docs = await PrintCursor.find(query)
    .sort({ createdAt: -1, tie: -1 })
    .limit(limit);

  let nextCursor = null;

  if (docs.length === limit) {
    const lastDoc = docs[docs.length - 1];
    nextCursor = {
      cursorCreatedAt: lastDoc.createdAt.toISOString(),
      cursorTie: lastDoc.tie,
    };
  }

  res.json({
    data: docs,
    nextCursor,
  });
})

const createCursorTestCases = async (data) => {

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
    await CursorTestCases.create({
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

}


const getCursorTestCases = asyncHandler(async (req, res) => {
  const { pageLimit, cursorCreatedAt, cursorTie } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const limit = parseInt(pageLimit, 10) || PAGE_LIMIT_DEFAULT;

  const isInitialFetch =
    cursorCreatedAt === "init" && cursorTie === "init";

  const userIdObj = new mongoose.Types.ObjectId(userId);

  const query = { userId: userIdObj };

  if (!isInitialFetch) {
    const createdAtDate = new Date(cursorCreatedAt);
    const tieNum = Number(cursorTie);

    if (!isNaN(createdAtDate.getTime()) && !isNaN(tieNum)) {
      query.$or = [
        { createdAt: { $lt: createdAtDate } },
        {
          createdAt: createdAtDate,
          tie: { $lt: tieNum },
        },
      ];
    }
  }

  const docs = await CursorTestCases.aggregate([
    { $match: query },

    { $sort: { createdAt: -1, tie: -1 } },

    { $limit: limit },

    {
      $lookup: {
        from: "problems",
        localField: "problemId",
        foreignField: "_id",
        as: "problem",
      },
    },

    { $unwind: { path: "$problem", preserveNullAndEmptyArrays: true } },

    // project ONLY what frontend needs
    {
      $project: {
        language: 1,
        totalTestCases: 1,
        status: 1,
        passedNo: 1,
        createdAt: 1,
        tie: 1,
        problemId: 1,
        name: "$problem.title",
        firstTestCaseDuration: {
          $arrayElemAt: ["$testCases.duration", 0],
        },
      },
    },
  ]);

  let nextCursor = null;

  if (docs.length === limit) {
    const lastDoc = docs[docs.length - 1];
    nextCursor = {
      cursorCreatedAt: lastDoc.createdAt.toISOString(),
      cursorTie: lastDoc.tie,
    };
  }

  res.json({
    data: docs,
    nextCursor,
  });
});



export { createCursorProgrammiz, getCursorProgrammiz, createCursorPrint, getCursorPrint, createCursorTestCases, getCursorTestCases }
