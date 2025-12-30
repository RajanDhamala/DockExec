import { Router } from "express";
import AuthUser from "../Middlewares/AuthMiddelware.js"
import { getNotificationData, UpdateNotificationSetting } from "../Controllers/NotificationController.js"
const NotificationRouter = Router()



NotificationRouter.get("/", AuthUser, getNotificationData)
NotificationRouter.post("/setNotfications", AuthUser, UpdateNotificationSetting)

export default NotificationRouter
