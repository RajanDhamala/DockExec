import mongoose from "mongoose";

const UserCodeDraftSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: "Problem", required: true, index: true },
  language: { type: String, required: true },
  code: { type: String, default: "" },
}, { timestamps: true });

UserCodeDraftSchema.index({ userId: 1, problemId: 1, language: 1 }, { unique: true });

const UserCodeDraft = mongoose.models.UserCodeDraft || mongoose.model("UserCodeDraft", UserCodeDraftSchema);
export default UserCodeDraft;
