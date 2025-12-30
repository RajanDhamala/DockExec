import { Router } from "express";
import AuthUser from "../Middlewares/AuthMiddelware.js"
import {
  ViewRecentExecutionsDetail, GetProfile, getRecentActivity, ChangePassword, RecentExecutions, reRunRecentExecutions, LogRecentExecutionsDetail, DelRecentExecution, AvgTestCaseStats, viewAvgTestLogs, DeleteAvgTestStats, RecentPrintRuns, viewRecentPrintsOutput, reRunRecentPrints, DeletePrints, ProgrammizExecutions, reRunPorgrammiz,
  DeleteProgrammiz, viewProgrammizLogs
} from "../Controllers/ProfileController.js"


const ProfileRouter = Router()

ProfileRouter.get("/", (req, res) => {
  return res.send("profile endpoint is up")
})

ProfileRouter.get("/usrProfile", AuthUser, GetProfile)
ProfileRouter.get("/recentActivity", AuthUser, getRecentActivity)

ProfileRouter.post("/changePassord", AuthUser, ChangePassword)

ProfileRouter.get("/recentExe", AuthUser, RecentExecutions)
ProfileRouter.get("/reRunrecentExe/:runId", AuthUser, reRunRecentExecutions)
ProfileRouter.get("/LogRecentExe/:exeId", AuthUser, LogRecentExecutionsDetail)
ProfileRouter.delete("/delRecentExe/:exeId", AuthUser, DelRecentExecution)

ProfileRouter.get("/recentExeViews/:exeId", AuthUser, ViewRecentExecutionsDetail)

ProfileRouter.get("/avgTeststats", AuthUser, AvgTestCaseStats)
ProfileRouter.get("/avgTestLogs/:problemId", AuthUser, viewAvgTestLogs)
ProfileRouter.delete("/avgTest/:problemId", AuthUser, DeleteAvgTestStats)

ProfileRouter.get("/printCases", AuthUser, RecentPrintRuns)
ProfileRouter.get("/printTestOutput/:problemId", AuthUser, viewRecentPrintsOutput)
ProfileRouter.get("/printCase_id/:problmeId/:runId", AuthUser, reRunRecentPrints)
ProfileRouter.delete("/DelprintCase_id/:runId", AuthUser, DeletePrints)

ProfileRouter.get("/programmizLogs", AuthUser, ProgrammizExecutions)
ProfileRouter.get("/viewProgrammizOutput/:runId", AuthUser, viewProgrammizLogs)
ProfileRouter.get("/reRunProgrammiz/:runId", AuthUser, reRunPorgrammiz)
ProfileRouter.delete("/deleteProgrammiz/:runId", AuthUser, DeleteProgrammiz)



export default ProfileRouter
