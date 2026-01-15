import { Router } from "express";
import AuthUser from "../Middlewares/AuthMiddelware.js";
import { getUrToken, getTokenUsageGraph } from "../Controllers/TokenContoller.js";
import { runReconnectEmailCron, runReviewEmailCron } from "../Utils/MailCornJob.js"
import createLimiter from "../Middlewares/ExpressRatelimit.js";

const TokenRouter = Router()

TokenRouter.get("/", createLimiter("normal"), AuthUser, getUrToken)
TokenRouter.get("/graph", createLimiter("tokenGraph"), AuthUser, getTokenUsageGraph)
TokenRouter.get("/demo", runReviewEmailCron)
TokenRouter.get("/reconnect", runReconnectEmailCron)

export default TokenRouter
