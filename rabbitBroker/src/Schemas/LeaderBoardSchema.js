
import mongoose from "mongoose";

const LeaderBoardSchema = new mongoose.Schema({
  pointsHistogram: [{
    min: {
      type: Number,
      required: true,
    }, max: {
      type: Number,
      required: true
    }, count: {
      type: Number,
      required: true
    }
  }], createdAt: {
    type: Date,
    default: Date.now()
  }, totalUsers: {
    type: Number,
    required: true
  }

})

const LeaderBoard = mongoose.model("LeaderBoard", LeaderBoardSchema)

export default LeaderBoard
