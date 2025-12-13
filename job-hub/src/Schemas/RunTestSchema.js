import mongoose from "mongoose"

const RunResultSchema=new mongoose.Schema({
   jobId:{type:mongoose.Schema.Types.ObjectId,ref:"Job",required:true}, 
   
})