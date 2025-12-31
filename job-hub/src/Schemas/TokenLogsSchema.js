
import mongoose from "mongoose";

const TokenLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true
  },
  tokenConsumed: {
    type: Number,
    required: true
  },
  endpoint: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

const TokenLog = mongoose.model("TokenLog", TokenLogSchema);

export default TokenLog;

