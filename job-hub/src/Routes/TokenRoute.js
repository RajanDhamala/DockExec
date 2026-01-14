import { Router } from "express";
import AuthUser from "../Middlewares/AuthMiddelware.js";
import { getUrToken, getTokenUsageGraph } from "../Controllers/TokenContoller.js";
import { runReconnectEmailCron, runReviewEmailCron } from "../Utils/MailCornJob.js"

const TokenRouter = Router()

TokenRouter.get("/", AuthUser, getUrToken)
TokenRouter.get("/graph", AuthUser, getTokenUsageGraph)
TokenRouter.get("/demo", runReviewEmailCron)
TokenRouter.get("/reconnect", runReconnectEmailCron)

export default TokenRouter
