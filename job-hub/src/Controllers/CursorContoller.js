import CursorRawExecution from "../Schemas/ProgrammizCursor.js"
import { RedisClient } from "../Utils/RedisClient.js";
import asyncHandler from "../Utils/AsyncHandler.js";
import ApiError from "../Utils/ApiError.js";
import ApiResponse from "../Utils/ApiResponse.js";

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
    })

  } catch (err) {
    console.error("Raw execution DB insert failed:", err)
    return null
  }
}



const PAGE_LIMIT_DEFAULT = 8;

const getCursorProgrammiz = asyncHandler(async (req, res) => {
  const { pageLimit, cursorCreatedAt, cursorTie } = req.query;

  const limit = parseInt(pageLimit, 10) || PAGE_LIMIT_DEFAULT;

  const query = {};

  const createdAtNum = cursorCreatedAt != null ? Number(cursorCreatedAt) : null;
  const tieNum = cursorTie != null ? Number(cursorTie) : 0;

  if (createdAtNum !== null && !isNaN(createdAtNum)) {
    query.$or = [
      { createdAt: { $lt: createdAtNum } },
      { createdAt: createdAtNum, tie: { $gt: tieNum } },
    ];
  }

  // Fetch documents
  const docs = await CursorRawExecution.find(query)
    .sort({ createdAt: -1, tie: 1 })
    .limit(limit);

  // Prepare next cursor
  let nextCursor = null;
  if (docs.length > 0) {
    const lastDoc = docs[docs.length - 1];
    nextCursor = {
      cursorCreatedAt: lastDoc.createdAt,
      cursorTie: lastDoc.tie || 1,
    };
  }

  res.json({
    data: docs,
    nextCursor,
  });
});






export { createCursorProgrammiz, getCursorProgrammiz }
