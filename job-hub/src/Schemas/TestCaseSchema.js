
import mongoose from "mongoose";

// --- TestCase schema ---
const TestCaseSchema = new mongoose.Schema({
  _id: { type: String, unique: true }, // jobId
  userId: { type: mongoose.Schema.ObjectId, required: true ,ref:"User",index:true},       // user _id string
  problemId: { type: mongoose.Schema.ObjectId, required: true ,ref:"Problem",index:true},    // problem _id string
  language: { type: String, required: true },
  totalTestCases: { type: Number, default: 0 },
  status: { type: String, default: "executed" },
  passedNo:{type:Number},
  code:{type:String},
  testCases: [
    {
      caseId: String,
      testCaseNumber: Number,
      input: String,
      expectedOutput: String,
      userOutput: String,
      duration: Number,
      isPassed: Boolean,
      executedAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

// Safe model registration
const TestCase = mongoose.models.TestCase || mongoose.model("TestCase", TestCaseSchema);
export default TestCase