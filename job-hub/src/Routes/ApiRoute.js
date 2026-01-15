import Router from "express"
import { execCode, handleFeedback } from "../Controllers/ApiController.js"
import AuthIdemptent from "../Middlewares/IdempotentMiddleware.js"
import countTokenMiddle from "../Middlewares/TokenCountMiddle.js"
import { uploadFeedbackImages } from "../Middlewares/FeedBackMulter.js"
import createLimiter from "../Middlewares/ExpressRatelimit.js"

const ApiRouter = Router()


ApiRouter.get("/", (req, res) => {
  return res.send("api route is up and running")
})

ApiRouter.post("/exec", createLimiter("programmizExec"), AuthIdemptent, countTokenMiddle, execCode)

ApiRouter.post("/feedback", createLimiter("feedback"), uploadFeedbackImages, handleFeedback);
export default ApiRouter
