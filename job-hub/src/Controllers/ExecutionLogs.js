import User from "../Schemas/UserSchema.js"
import TestCase from "../Schemas/UserSchema.js"
import TrialRunner from "../Schemas/TrialSchema.js"
import RawExecution from "../Schemas/RawSchema.js"


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
    conosle.log("data:", data)
//save the Submisson logs

}

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
