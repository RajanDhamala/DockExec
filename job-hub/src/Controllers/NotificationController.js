import asyncHandler from "../Utils/AsyncHandler.js";
import ApiError from "../Utils/ApiError.js";
import ApiResponse from "../Utils/ApiResponse.js";
import Notification from "../Schemas/NotificationSchema.js"

const getNotificationData = asyncHandler(async (req, res) => {
  const user = req.user

  let notification = await Notification.findOne({ userId: user.id })
  if (!notification) {
    notification = await Notification.create({ userId: user.id })
  }
  return res.send(new ApiResponse(200, "succecsfully fetched notification setting", notification))
})


const UpdateNotificationSetting = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { toggles } = req.body;

  if (!Array.isArray(toggles) || toggles.length === 0) {
    throw new ApiError(400, null, "toggle req should not be empty")
  }

  const allowedFields = [
    "emailNotifications",
    "pushNotifications",
    "smsNotifications",
    "workflowSuccess",
    "workflowFailure",
    "weeklyReports",
    "securityAlerts"
  ];

  let notification = await Notification.findOne({ userId });

  if (!notification) {
    notification = await Notification.create({ userId });
  }

  const updatedFields = {};

  toggles.forEach((field) => {
    if (allowedFields.includes(field)) {
      notification[field] = !notification[field];
      updatedFields[field] = notification[field];
    }
  });

  await notification.save();

  return res.send(new ApiResponse(200, "succecsfully updated notfication settings", notification))
})



export {
  getNotificationData, UpdateNotificationSetting
}
