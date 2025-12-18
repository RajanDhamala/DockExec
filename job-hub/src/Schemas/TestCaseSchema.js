import mongoose from "mongoose";

const TestCaseSchema = new mongoose.Schema({
  Caseid: {
    type: String,
    index: true
  },
  userCode: {
    type: String
  },
  ttx: {
    type: Number
  },
  GeneratedCode: {
    type: String
  },
  output: {
    type: String
  },
  ExecutedAt: {
    type: Date,
    default: Date.now
  },
 status: {
    type: String
    , enum: ["Success", "Failed"],
    default: "Success"
  },
}, { _id: false }); 

const RunResultSchema = new mongoose.Schema({
  _id: {
    type: String,
    unique: true
  },
  problemid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Problem",
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  language: {
    type: String,
    required: true
  },
  TestCases: [TestCaseSchema]
}, { timestamps: true });

const RunResult = mongoose.model("RunResult", RunResultSchema);
export default RunResult;
