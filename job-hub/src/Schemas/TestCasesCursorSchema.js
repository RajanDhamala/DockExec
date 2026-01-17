import mongoose from "mongoose";

const CursorTestCasesSchema = new mongoose.Schema({
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


CursorTestCasesSchema.index({ userId: 1, createdAt: -1, tie: -1 })
const CursorTestCases = mongoose.models.TestCase || mongoose.model("CursorTestCasesSchema", CursorTestCasesSchema);

export default CursorTestCases
