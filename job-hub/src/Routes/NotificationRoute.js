import { Router } from "express";
import AuthUser from "../Middlewares/AuthMiddelware.js"
import { getNotificationData, UpdateNotificationSetting } from "../Controllers/NotificationController.js"
const NotificationRouter = Router()

NotificationRouter.get("/", (req, res) => {
  return res.send("nofication route is up and running")
})

NotificationRouter.get("/Notifications", AuthUser, getNotificationData)
NotificationRouter.get("/setNotfications", AuthUser, UpdateNotificationSetting)

export default NotificationRouter
