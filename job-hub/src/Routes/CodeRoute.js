import Router from "express"
import { getList, GetData, TestPrintCode, GetSubmissons, AllTestCases } from "../Controllers/LeetCodeController.js"
import AuthUser from "../Middlewares/AuthMiddelware.js"

const CodeRouter = Router()

CodeRouter.get("/", (req, res) => {
    res.send("code route is up and running");
})

CodeRouter.get("/list", getList)

CodeRouter.get("/getProblem/:id", GetData)

CodeRouter.post("/testPrint", AuthUser, TestPrintCode)

CodeRouter.post("/Alltest_Cases", AuthUser, AllTestCases)

CodeRouter.get("/submissions/:problemId", AuthUser, GetSubmissons)



export default CodeRouter
