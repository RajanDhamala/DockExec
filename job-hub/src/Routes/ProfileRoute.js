import { Router } from "express";
import AuthUser from "../Middlewares/AuthMiddelware.js"
import { GetProfile, ChangePassword, RecentExecutions, AvgTestCaseStats, DeleteAvgTestStats, RecentPrintRuns, ProgrammizExecutions } from "../Controllers/ProfileController.js"

const ProfileRouter = Router()

ProfileRouter.get("/", (req, res) => {
  return res.send("profile endpoint is up")
})

ProfileRouter.get("/usrProfile", AuthUser, GetProfile)

ProfileRouter.post("/changePassord", AuthUser, ChangePassword)

ProfileRouter.get("/recentExe", AuthUser, RecentExecutions)

ProfileRouter.get("/avgTeststats", AuthUser, AvgTestCaseStats)

ProfileRouter.delete("/avgTest/:problemId", AuthUser, DeleteAvgTestStats)

ProfileRouter.get("/printCases", AuthUser, RecentPrintRuns)

ProfileRouter.get("/programmizLogs", AuthUser, ProgrammizExecutions)

export default ProfileRouter
