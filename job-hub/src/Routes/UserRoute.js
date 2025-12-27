import { Router } from "express";
import { LoginUser, RegisterUser, LogoutUser, UpdatePoints } from "../Controllers/UserController.js"
import AuthUser from "../Middlewares/AuthMiddelware.js"
import Whoareu from "../Middlewares/MeMiddle.js";

const UserRouter = Router()

UserRouter.get("/", (req, res) => {
    return res.send("users endpoint is up")
})

UserRouter.post("/register", RegisterUser)
UserRouter.post("/login", LoginUser)
UserRouter.get("/logout", AuthUser, LogoutUser)
UserRouter.get("/points/:problemId/:userId", UpdatePoints)
UserRouter.get("/me", Whoareu)


export default UserRouter
