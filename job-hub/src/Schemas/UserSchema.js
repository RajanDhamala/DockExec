import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    default: null
  },
  fullname: {
    type: String
  },
  points: {
    type: Number,
    default: 0,
    index: true
  },
  githubProviderId: {
    type: String,
    sparse: true,
    index: true,
    unique: true
  },
  googleProviderId: {
    type: String,
    sparse: true,
    index: true,
    unique: true
  },
  avatar: {
    type: String
  },
  dob: {
    type: Date
  },
  bio: {
    type: String
  },
  plan: {
    type: String,
    enum: ["free", "pro"],
    default: "free"
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: {
      type: [Number],
      default: undefined
    }
  },
  solvedTestCases: [
    {
      problemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Problem"
      },
      submitDate: {
        type: Date,
        default: Date.now
      }
    }
  ]
}, { timestamps: true });

UserSchema.index({ "location": "2dsphere" }, { sparse: true });

const UserModel = mongoose.model('User', UserSchema);

export default UserModel;
