import { Router } from "express";
import AuthUser from "../Middlewares/AuthMiddelware.js";
import { getUrToken, getTokenUsageGraph } from "../Controllers/TokenContoller.js";

const TokenRouter = Router()

TokenRouter.get("/", AuthUser, getUrToken)
TokenRouter.get("/graph", AuthUser, getTokenUsageGraph)


export default TokenRouter
