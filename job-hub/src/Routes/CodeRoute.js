import Router from "express"
import { getList, GetData, TestPrintCode, GetSubmissons, GetTestCode, AllTestCases, SaveDraftCode } from "../Controllers/LeetCodeController.js"
import AuthUser from "../Middlewares/AuthMiddelware.js"
import countTokenMiddle from "../Middlewares/TokenCountMiddle.js"
import AuthIdemptent from "../Middlewares/IdempotentMiddleware.js"
import createLimiter from "../Middlewares/ExpressRatelimit.js"

const CodeRouter = Router()

CodeRouter.get("/", (req, res) => {
    res.send("code route is up and running");
})

CodeRouter.get("/list", getList)

CodeRouter.get("/getProblem/:id", GetData)

CodeRouter.post("/testPrint", createLimiter("testPrint"), AuthIdemptent, countTokenMiddle, TestPrintCode)

CodeRouter.post("/Alltest_Cases", createLimiter("allTestCases"), AuthIdemptent, countTokenMiddle, AllTestCases)

CodeRouter.post("/saveDraft", createLimiter("saveDraft"), AuthUser, SaveDraftCode)

CodeRouter.get("/submissions/:problemId", createLimiter("normal"), AuthUser, GetSubmissons)

CodeRouter.get("/getUrCode/:testCaseId/:problemId", createLimiter("normal"), AuthUser, GetTestCode)


export default CodeRouter
