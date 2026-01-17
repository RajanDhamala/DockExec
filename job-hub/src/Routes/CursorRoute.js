
import { getCursorProgrammiz, getCursorPrint, getCursorTestCases } from "../Controllers/CursorContoller.js"
import AuthUser from "../Middlewares/AuthMiddelware.js"
import { Router } from "express";


const CursorRoute = Router()

CursorRoute.get("/", async (req, res) => {
 return res.send("cursor page is up and running")
})


CursorRoute.get("/getProgrammiz/:cursorCreatedAt/:cursorTie/:pageLimit", AuthUser, getCursorProgrammiz)

CursorRoute.get("/getPrint/:cursorCreatedAt/:cursorTie/:pageLimit", AuthUser, getCursorPrint)

CursorRoute.get("/getTestCases/:cursorCreatedAt/:cursorTie/:pageLimit", AuthUser, getCursorTestCases)


export default CursorRoute
