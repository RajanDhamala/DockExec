import { string } from "joi";
import mongoose from "mongoose";
const RunCodeSchema = new mongoose.Schema({
  _id:{
    type:string,
    unique:true
  },
  problemid: {
    type: mongoose.schema.types.objectid,
    ref: "Problem", required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", required: true
  },
  language: {
    type: String, required: true
  },
  Usercode: {
    type: String, required: true
  },
  GeneratedCode: {
    type: String, required: true
  },
  status: {
    type: String
    , enum: ["Success", "Failed"],
    default: "Success"
  },
  output: {
    type: String
  },
}, { timestamps: true });

const Job = mongoose.model("Job",RunCodeSchema )
export default Job;
