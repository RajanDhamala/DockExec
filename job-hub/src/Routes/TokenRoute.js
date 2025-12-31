import { Router } from "express";
import AuthUser from "../Middlewares/AuthMiddelware.js";
import { getUrToken } from "../Controllers/TokenContoller.js";

const TokenRouter = Router()

TokenRouter.get("/", AuthUser, getUrToken)


export default TokenRouter
