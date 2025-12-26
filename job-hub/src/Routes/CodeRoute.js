import Router from "express"
import { getList, GetData, TestPrintCode, GetSubmissons, GetTestCode, AllTestCases, SaveDraftCode } from "../Controllers/LeetCodeController.js"
import AuthUser from "../Middlewares/AuthMiddelware.js"

const CodeRouter = Router()

CodeRouter.get("/", (req, res) => {
    res.send("code route is up and running");
})

CodeRouter.get("/list", getList)

CodeRouter.get("/getProblem/:id", GetData)

CodeRouter.post("/testPrint", AuthUser, TestPrintCode)

CodeRouter.post("/Alltest_Cases", AuthUser, AllTestCases)

CodeRouter.post("/saveDraft", AuthUser, SaveDraftCode)

CodeRouter.get("/submissions/:problemId", AuthUser, GetSubmissons)

CodeRouter.get("/getUrCode/:testCaseId/:problemId", AuthUser, GetTestCode)


export default CodeRouter
