import mongoose from "mongoose";

const FeedbackSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },

    description: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 500
    },

    images: {
      type: [String],
      validate: {
        validator: (arr) => arr.length <= 3,
        message: "Maximum 3 images allowed"
      },
      default: []
    }
  },
  {
    timestamps: true
  }
);

const Feedback = mongoose.model("Feedback", FeedbackSchema);
export default Feedback;
