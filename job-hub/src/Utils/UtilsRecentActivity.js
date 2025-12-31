
import RecentActivity from "../Schemas/RecentActivitySchema.js";

const MAX_ACTIVITY = 35;

const pushRecentActivity = async (userId, activity) => {
  console.log("Pushing to DB:", userId, activity);

  await RecentActivity.updateOne(
    { userId }, // matches schema
    {
      $push: {
        MetaData: {
          $each: [
            {
              title: activity.title,
              status: activity.status,
              description: activity.description,
              browserMeta: activity.browserMeta || {},
              atTime: activity.atTime || new Date()
            }
          ],
          $slice: -MAX_ACTIVITY
        }
      }
    },
    { upsert: true }
  );
};

export default pushRecentActivity;

