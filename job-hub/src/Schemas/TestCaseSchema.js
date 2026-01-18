
import mongoose from "mongoose";

const TestCaseSchema = new mongoose.Schema({
  _id: {
    type: String
  },
  userId: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: "User",
    index: true
  },
  problemId: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: "Problem",
    index: true
  },
  language: {
    type: String,
    required: true
  },
  totalTestCases: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    default: "failed"
  },
  passedNo: {
    type: Number
  },
  code: {
    type: String
  }, createdAt: {
    type: Date,
    default: Date.now(),
    index: true
  }, tie: {
    type: Number,
    default: 0,
    index: true
  },
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
}, { timestamps: false });

TestCaseSchema.index({ userId: 1, createdAt: -1, tie: -1 })

const TestCase = mongoose.models.TestCase || mongoose.model("TestCase", TestCaseSchema);
export default TestCase
