
import { getCursorProgrammiz } from "../Controllers/CursorContoller.js"
import AuthUser from "../Middlewares/AuthMiddelware.js"
import { Router } from "express";


const CursorRoute = Router()

CursorRoute.get("/", async (req, res) => {
 return res.send("cursor page is up and running")
})


CursorRoute.get("/getList", AuthUser, getCursorProgrammiz)

export default CursorRoute
