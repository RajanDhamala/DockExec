
import mongoose from "mongoose";

const TokenQuotaSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  monthlyLimit: {
    type: Number,
    default: 30000,
    min: 0
  },
  tokenUsed: {
    type: Number,
    default: 0
  },
  lastResetAt: {
    type: Date,
    default: Date.now
  },
  cycleStartsAt: {
    type: Date
  },
  cycleEndsAt: {
    type: Date
  }
}, { timestamps: true });

const TokenQuota = mongoose.model("TokenQuota", TokenQuotaSchema);

export default TokenQuota;

