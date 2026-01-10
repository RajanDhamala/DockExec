import { Router } from "express";
import { LoginUser, RegisterUser, LogoutUser, UpdatePoints, ChangeUserAvatar, UpdateProfile, getYourLocation, UpdateUserCoordinates, GeturPoints, getLeaderboard, getUsersNearYou, getUserBasicMetrics, AvgExectionTimeMetrics, exeMetrics, DeleteAccount } from "../Controllers/UserController.js"
import AuthUser from "../Middlewares/AuthMiddelware.js"
import Whoareu from "../Middlewares/MeMiddle.js";
import avatarUpload from "../Middlewares/AvatarUpload.js"

const UserRouter = Router()

UserRouter.get("/", (req, res) => {
  res.send("users endpoint is up")
})

UserRouter.post("/register", RegisterUser)
UserRouter.post("/login", LoginUser)
UserRouter.get("/logout", AuthUser, LogoutUser)
UserRouter.get("/points/:problemId/:userId", UpdatePoints)
UserRouter.get("/me", Whoareu)
UserRouter.get("/urCoordinates", AuthUser, getYourLocation)
UserRouter.post("/upCoordinates", AuthUser, UpdateUserCoordinates)
UserRouter.get("/location", AuthUser, getUsersNearYou)
UserRouter.get("/percentile", AuthUser, GeturPoints)
UserRouter.get("/globalLeaderboard", getLeaderboard)
UserRouter.get("/Basicmetrics/:days", AuthUser, getUserBasicMetrics)
UserRouter.get("/exeTime/:language/:problemId", AuthUser, AvgExectionTimeMetrics)
UserRouter.get("/timeMetrics", AuthUser, exeMetrics)
UserRouter.delete("/delAccount", AuthUser, DeleteAccount)


UserRouter.put(
  "/changeAvatar",
  AuthUser,
  avatarUpload.single("avatar"),
  async (req, res) => {
    await ChangeUserAvatar(req, res);
  }
);

UserRouter.put("/updateProfile", AuthUser, UpdateProfile)

export default UserRouter

