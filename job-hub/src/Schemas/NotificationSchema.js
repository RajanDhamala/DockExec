
import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true // one preference doc per user
    },

    // Notification Channels
    emailNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: false
    },

    // Event Notifications
    workflowSuccess: {
      type: Boolean,
      default: true
    },
    workflowFailure: {
      type: Boolean,
      default: true
    },
    weeklyReports: {
      type: Boolean,
      default: false
    },
    securityAlerts: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const Notification = mongoose.model("Notification", NotificationSchema);
export default Notification

