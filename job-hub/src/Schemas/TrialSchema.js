import mongoose from "mongoose";

const RunCodeSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      unique: true,
    },

    problemid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
      index:true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index:true
    },

    language: {
      type: String,
      required: true,
    },
    generatedCode: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      default: "Success",
    },

    output: {
      type: String,
    },

    socketId: {
      type: String,
    },

    execution_time: {
      type: Number, 
    },
  },
  { timestamps: true }
);

const TrialRunner = mongoose.model("TrialResult", RunCodeSchema);

export default TrialRunner;
