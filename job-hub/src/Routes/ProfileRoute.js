import { Router } from "express";
import AuthUser from "../Middlewares/AuthMiddelware.js"
import {
  ViewRecentExecutionsDetail, GetProfile, getRecentActivity, ChangePassword, RecentExecutions, reRunRecentExecutions, LogRecentExecutionsDetail, DelRecentExecution, AvgTestCaseStats, viewAvgTestLogs, DeleteAvgTestStats, RecentPrintRuns, viewRecentPrintsOutput, reRunRecentPrints, DeletePrints, ProgrammizExecutions, reRunPorgrammiz,
  DeleteProgrammiz, viewProgrammizLogs
} from "../Controllers/ProfileController.js"
import AuthIdemptent from "../Middlewares/IdempotentMiddleware.js"
import createLimiter from "../Middlewares/ExpressRatelimit.js";

const ProfileRouter = Router()

ProfileRouter.get("/", (req, res) => {
  return res.send("profile endpoint is up")
})

ProfileRouter.get("/usrProfile", createLimiter("normal"), AuthUser, GetProfile)
ProfileRouter.get("/recentActivity", createLimiter("normal"), AuthUser, getRecentActivity)

ProfileRouter.post("/changePassword", createLimiter("changePassword"), AuthUser, ChangePassword)

ProfileRouter.get("/getTestCases/:cursorCreatedAt/:cursorTie/:pageLimit", createLimiter("normal"), AuthUser, RecentExecutions)
ProfileRouter.get("/reRunrecentExe/:runId/:socketId", createLimiter("reRunRecentExe"), AuthIdemptent, reRunRecentExecutions)
ProfileRouter.get("/LogRecentExe/:exeId", createLimiter("normal"), AuthUser, LogRecentExecutionsDetail)
ProfileRouter.delete("/delRecentExe/:exeId", createLimiter("normal"), AuthUser, DelRecentExecution)

ProfileRouter.get("/recentExeViews/:exeId", createLimiter("normal"), AuthUser, ViewRecentExecutionsDetail)

ProfileRouter.get("/avgTeststats", createLimiter("normal"), AuthUser, AvgTestCaseStats)
ProfileRouter.get("/avgTestLogs/:problemId", createLimiter("normal"), AuthUser, viewAvgTestLogs)
ProfileRouter.delete("/avgTest/:problemId", createLimiter("normal"), AuthUser, DeleteAvgTestStats)

ProfileRouter.get("/getPrint/:cursorCreatedAt/:cursorTie/:pageLimit", createLimiter("normal"), AuthUser, RecentPrintRuns)
ProfileRouter.get("/printTestOutput/:problemId", createLimiter("normal"), AuthUser, viewRecentPrintsOutput)
ProfileRouter.get("/printCase_id/:runId/:socketId", createLimiter("reRunTestPrint"), AuthIdemptent, reRunRecentPrints)
ProfileRouter.delete("/DelprintCase_id/:runId", createLimiter("normal"), AuthUser, DeletePrints)

ProfileRouter.get("/getProgrammiz/:cursorCreatedAt/:cursorTie/:pageLimit", createLimiter("normal"), AuthUser, ProgrammizExecutions)
ProfileRouter.get("/viewProgrammizOutput/:runId", createLimiter("normal"), AuthUser, viewProgrammizLogs)
ProfileRouter.get("/reRunProgrammiz/:runId/:socketId", createLimiter("reRunProgrammiz"), AuthIdemptent, reRunPorgrammiz)
ProfileRouter.delete("/deleteProgrammiz/:runId", createLimiter("normal"), AuthUser, DeleteProgrammiz)



export default ProfileRouter
