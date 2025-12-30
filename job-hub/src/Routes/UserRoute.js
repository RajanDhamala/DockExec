import { Router } from "express";
import { LoginUser, RegisterUser, LogoutUser, UpdatePoints, ChangeUserAvatar, UpdateProfile} from "../Controllers/UserController.js"
import AuthUser from "../Middlewares/AuthMiddelware.js"
import Whoareu from "../Middlewares/MeMiddle.js";
import avatarUpload from "../Middlewares/AvatarUpload.js"

const UserRouter = Router()

UserRouter.get("/", (req, res) => {
    return res.send("users endpoint is up")
})

UserRouter.post("/register", RegisterUser)
UserRouter.post("/login", LoginUser)
UserRouter.get("/logout", AuthUser, LogoutUser)
UserRouter.get("/points/:problemId/:userId", UpdatePoints)
UserRouter.get("/me", Whoareu) 
   
UserRouter.put(
  "/changeAvatar",
  AuthUser,
  avatarUpload.single("avatar"),
  async (req, res) => {
    await ChangeUserAvatar(req, res);
  }
);

UserRouter.put("/updateProfile",AuthUser, UpdateProfile)

export default UserRouter

