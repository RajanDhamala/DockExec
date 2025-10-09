import { Router } from "express";
import {LoginUser,RegisterUser,LogoutUser} from "../Controllers/UserController.js"
import AuthUser from "../Middlewares/AuthMiddelware.js"
const UserRouter=Router()

UserRouter.get("/",(req,res)=>{
    return res.send("users endpoint is up")
})

UserRouter.post("/register",RegisterUser)
UserRouter.post("/login",LoginUser)
UserRouter.get("/logout",AuthUser,LogoutUser)


export default UserRouter