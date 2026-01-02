import { Router } from "express";
import { LoginUser, RegisterUser, LogoutUser, UpdatePoints, ChangeUserAvatar, UpdateProfile, UpdateUserCoordinates, getUsersNearYou, getUserBasicMetrics, DeleteAccount } from "../Controllers/UserController.js"
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
UserRouter.post("/upCoordinates", AuthUser, UpdateUserCoordinates)
UserRouter.get("/location", AuthUser, getUsersNearYou)
UserRouter.get("/Basicmetrics/:days", AuthUser, getUserBasicMetrics)

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

