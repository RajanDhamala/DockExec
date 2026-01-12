import { Router } from "express";
import AuthUser from "../Middlewares/AuthMiddelware.js"
import {
  ViewRecentExecutionsDetail, GetProfile, getRecentActivity, ChangePassword, RecentExecutions, reRunRecentExecutions, LogRecentExecutionsDetail, DelRecentExecution, AvgTestCaseStats, viewAvgTestLogs, DeleteAvgTestStats, RecentPrintRuns, viewRecentPrintsOutput, reRunRecentPrints, DeletePrints, ProgrammizExecutions, reRunPorgrammiz,
  DeleteProgrammiz, viewProgrammizLogs
} from "../Controllers/ProfileController.js"
import AuthIdemptent from "../Middlewares/IdempotentMiddleware.js"

const ProfileRouter = Router()

ProfileRouter.get("/", (req, res) => {
  return res.send("profile endpoint is up")
})

ProfileRouter.get("/usrProfile", AuthUser, GetProfile)
ProfileRouter.get("/recentActivity", AuthUser, getRecentActivity)

ProfileRouter.post("/changePassword", AuthUser, ChangePassword)

ProfileRouter.get("/recentExe", AuthUser, RecentExecutions)
ProfileRouter.get("/reRunrecentExe/:runId/:socketId", AuthIdemptent, reRunRecentExecutions)
ProfileRouter.get("/LogRecentExe/:exeId", AuthUser, LogRecentExecutionsDetail)
ProfileRouter.delete("/delRecentExe/:exeId", AuthUser, DelRecentExecution)

ProfileRouter.get("/recentExeViews/:exeId", AuthUser, ViewRecentExecutionsDetail)

ProfileRouter.get("/avgTeststats", AuthUser, AvgTestCaseStats)
ProfileRouter.get("/avgTestLogs/:problemId", AuthUser, viewAvgTestLogs)
ProfileRouter.delete("/avgTest/:problemId", AuthUser, DeleteAvgTestStats)

ProfileRouter.get("/printCases", AuthUser, RecentPrintRuns)
ProfileRouter.get("/printTestOutput/:problemId", AuthUser, viewRecentPrintsOutput)
ProfileRouter.get("/printCase_id/:runId/:socketId", AuthIdemptent, reRunRecentPrints)
ProfileRouter.delete("/DelprintCase_id/:runId", AuthUser, DeletePrints)

ProfileRouter.get("/programmizLogs", AuthUser, ProgrammizExecutions)
ProfileRouter.get("/viewProgrammizOutput/:runId", AuthUser, viewProgrammizLogs)
ProfileRouter.get("/reRunProgrammiz/:runId/:socketId", AuthIdemptent, reRunPorgrammiz)
ProfileRouter.delete("/deleteProgrammiz/:runId", AuthUser, DeleteProgrammiz)



export default ProfileRouter
