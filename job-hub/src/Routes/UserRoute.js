import { Router } from "express";
import { LoginUser, RegisterUser, verifyResetToken, LogoutUser, ForgotPassword, UpdatePoints, ChangeUserAvatar, UpdateProfile, getYourLocation, UpdateUserCoordinates, GeturPoints, getLeaderboard, getUsersNearYou, getUserBasicMetrics, AvgExectionTimeMetrics, exeMetrics, DeleteAccount } from "../Controllers/UserController.js"
import AuthUser from "../Middlewares/AuthMiddelware.js"
import Whoareu from "../Middlewares/MeMiddle.js";
import avatarUpload from "../Middlewares/AvatarUpload.js"
import RedisLimiter from "../Middlewares/RedisLimitMiddleware.js";
import createLimiter from "../Middlewares/ExpressRatelimit.js";

const UserRouter = Router()

UserRouter.get("/", (req, res) => {
  res.send("users endpoint is up")
})

UserRouter.post("/register", RedisLimiter("register"), RegisterUser)
UserRouter.post("/login", RedisLimiter("login"), LoginUser)
UserRouter.post("/forgot-password", RedisLimiter("forgot_password"), ForgotPassword)
UserRouter.post("/reset-psd", RedisLimiter("reset_password"), verifyResetToken)
UserRouter.get("/logout", createLimiter("logout"), AuthUser, LogoutUser)
UserRouter.get("/points/:problemId/:userId", createLimiter("normal"), UpdatePoints)
UserRouter.get("/me", createLimiter("normal"), Whoareu)
UserRouter.get("/urCoordinates", createLimiter("getMetrics"), AuthUser, getYourLocation)
UserRouter.post("/upCoordinates", createLimiter("normal"), AuthUser, UpdateUserCoordinates)
UserRouter.get("/location", createLimiter("changeCoordinates"), AuthUser, getUsersNearYou)
UserRouter.get("/percentile", createLimiter("normal"), AuthUser, GeturPoints)
UserRouter.get("/globalLeaderboard", createLimiter("normal"), getLeaderboard)
UserRouter.get("/Basicmetrics/:days", createLimiter("getMetrics"), AuthUser, getUserBasicMetrics)
UserRouter.get("/exeTime/:language/:problemId", createLimiter("getMetrics"), AuthUser, AvgExectionTimeMetrics)
UserRouter.get("/timeMetrics", createLimiter("getMetrics"), AuthUser, exeMetrics)
UserRouter.delete("/delAccount", createLimiter("normal"), AuthUser, DeleteAccount)


UserRouter.put("/changeAvatar", createLimiter("changeProfile"), AuthUser, avatarUpload.single("avatar"),
  async (req, res) => {
    await ChangeUserAvatar(req, res);
  }
);

UserRouter.put("/updateProfile", createLimiter("changeProfile"), AuthUser, UpdateProfile)

export default UserRouter

