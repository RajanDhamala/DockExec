import asyncHandler from "../Utils/AsyncHandler.js";
import  Problem from "../Schemas/CodeSchema.js"
import ApiError from "../Utils/ApiError.js";
import ApiResponse from "../Utils/ApiResponse.js";languageWrappers 
import languageWrappers from "../Utils/CodeWrapper.js"  
import { producer } from "../Utils/KafkaProvider.js";
import { v4 as uuidv4 } from 'uuid';

const getList=asyncHandler(async(req,res)=>{
    const list=await Problem.find().select("title")
    return res.send(new ApiResponse(200,'fetcehed problem list',list))
})

const GetData=asyncHandler(async(req,res)=>{
    const {id}=req.params

    if(!id){
        throw new ApiError(400,'please add the id in req')
    }
    const CodeData=await Problem.findOne({_id:id}).select("-testCases")
    if(!CodeData){
        throw new ApiError(400,'invalid problem id')
    }
    return res.send (new ApiResponse(200,'fetched problem data',CodeData))
})

const RunCode = asyncHandler(async (req, res) => {
    const { code, language, problemId,socketId } = req.body;
    const { type } = req.params;
  const uuid=uuidv4()
  console.log("executing code..")
    if (!code || !language || !type || !problemId ||!socketId) {
        throw new ApiError(400, 'please include type, language, code, and problemId in request');
    }

  if(type=="submit"){
  const problem = await Problem.findById(problemId).select({
    [`languageTemplates.${language}`]: 1,
    testCases: 1,            // Get ALL test cases
    function_name: 1,
    parameters: 1,
    wrapper_type: 1
  });
  console.log("problem",problem)

      if (!problem) {
          throw new ApiError(404, 'Problem not found');
      }
  
      const testCases = problem.testCases;
      try {

      await producer.send({
        topic: "test_code",
        messages: [
          {
          value: JSON.stringify({ code, language, "id":uuid, problem, "testCase":problem.testCases[0], socketId,"userId":req.user.id,"problemId":problem._id,
            "function_name":problem.function_name,"parameters":problem.parameters,"wrapper_type":problem.wrapper_type }),
          },
        ],
      });
      console.log("code sent for running");
        } catch (error) {
          console.log("Failed to produce job:", error);
          throw new ApiError(400, "Failed to produce job for code execution");
        }
      return res.send(new ApiResponse(200,'code sent for running',uuid))

  }else if(type=="run"){
    console.log("code will be runned soon");
  const problem = await Problem.findById(problemId).select({
  [`languageTemplates.${language}`]: 1,
  testCases: { $slice: [0, 1] }, // Get only FIRST test case
  function_name: 1,
  parameters: 1,
  wrapper_type: 1
});
      if(!problem){
        throw new ApiError(400,'problem not fould')
      }

try {
      await producer.send({
        topic: "Runs_code",
        messages: [
          {
            value: JSON.stringify({ code, language ,"id":uuid,problem,"testCase":problem.testCases[0],socketId,
              "function_name":problem.function_name,"parameters":problem.parameters,"wrapper_type":problem.wrapper_type
            }),
          },
        ],
      });
      console.log("code sent for running");
        } catch (error) {
          console.log("Failed to produce job:", error);
          throw new ApiError(400, "Failed to produce job for code execution");
        }

      return res.send(new ApiResponse(200,'code sent for running',problem))
  }else{
    throw new ApiError(400,"invalid type")
  }

});

export {getList,GetData,RunCode}