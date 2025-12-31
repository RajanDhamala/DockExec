
import mongoose from "mongoose"

const RecentActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    MetaData: [
      {
        title: {
          type: String,
          required: true
        },
        status: {
          type: String,
          enum: ["success", "failed"],
          required: true
        },
        atTime: {
          type: Date,
          default: Date.now
        },
        description: {
          type: String
        },
        browserMeta: {
          type: mongoose.Schema.Types.Mixed,
          default: {}
        }
      }
    ]
  },
  { timestamps: true }
);

const RecentActivity = mongoose.model("RecentActivity", RecentActivitySchema);

export default RecentActivity;

