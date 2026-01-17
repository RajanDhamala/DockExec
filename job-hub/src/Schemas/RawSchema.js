import mongoose from "mongoose";
const RawSchema = new mongoose.Schema({
    _id: {
        type: String
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true
    },
    language: String,
    code: String,
    execution_time: Number,
    status: {
        type: String,
        default: "failed"
    },
    output: String,

    createdAt: {
        type: Date,
        required: true,
        index: true
    },
    tie: {
        type: Number,
        default: 0,
        index: true
    }
}
    , { timestamps: false });


RawSchema.index({ userId: 1, createdAt: -1, tie: -1 });


const RawExecution = mongoose.model("RawExecution", RawSchema)

export default RawExecution
