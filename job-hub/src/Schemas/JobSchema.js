import mongoose from "mongoose";
const JobSchema = new mongoose.Schema({
problemId: { type: mongoose.Schema.Types.ObjectId, ref: "Problem", required: true },
userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
language: { type: String, required: true },
Usercode: { type: String, required: true },
GeneratedCode: { type: String, required: true },
status: { type: String, enum: ["Pending", "Running", "Completed", "Failed"], default: "Pending" },
output:{ type: String },
},{timestamps:true});

const Job= mongoose.model("Job", JobSchema)
export default Job;