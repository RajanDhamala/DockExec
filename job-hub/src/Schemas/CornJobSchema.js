import mongoose from "mongoose";

const cronJobSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  lastRun: {
    type: Date,
    default: null
  },
  nextRun: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ["idle", "running"],
    default: "idle"
  }
}, { timestamps: true });

const CronJob = mongoose.model("CronJob", cronJobSchema);
export default CronJob;
