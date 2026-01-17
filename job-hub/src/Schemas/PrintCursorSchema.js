
import mongoose from "mongoose";

const PrintCursorSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
    },

    problemid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
      index: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true
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
    createdAt: {
      type: Date,
      default: Date.now()
    },
    tie: {
      type: Number,
      default: 0,
      index: true
    },
    execution_time: {
      type: Number,
    },
  }, { timestamps: false }
);


PrintCursorSchema.index({ userId: 1, createdAt: -1, tie: -1 });

const PrintCursor = mongoose.model("PrintCursorSchema", PrintCursorSchema);

export default PrintCursor;
