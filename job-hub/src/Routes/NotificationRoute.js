import { Router } from "express";
import AuthUser from "../Middlewares/AuthMiddelware.js"
import { getNotificationData, UpdateNotificationSetting } from "../Controllers/NotificationController.js"
import createLimiter from "../Middlewares/ExpressRatelimit.js";

const NotificationRouter = Router()

NotificationRouter.get("/", createLimiter("normal"), AuthUser, getNotificationData)
NotificationRouter.post("/setNotfications", createLimiter("setNotfication"), AuthUser, UpdateNotificationSetting)

export default NotificationRouter
