import asyncHandler from "../Utils/AsyncHandler.js"
import ApiError from "../Utils/ApiError.js"
import ApiResponse from "../Utils/ApiResponse.js"
import Joi from "joi"
import { hashPassword, verifyPassword, CreateAccessToken, CreateRefreshToken } from "../Utils/Authutils.js"
import UserModel from "../Schemas/UserSchema.js"
import Problem from "../Schemas/CodeSchema.js"

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  fullname: Joi.string().max(20).min(5).required(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

// Register user
const RegisterUser = asyncHandler(async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);

  if (error) {
    throw new ApiError(400, "Invalid input", error.details.map((d) => d.message));
  }

  const userExists = await UserModel.findOne({ email: value.email });
  if (userExists) {
    throw new ApiError(400, "User with this email already exists");
  }

  const hashedPassword = await hashPassword(value.password);
  const newUser = await UserModel.create({
    email: value.email,
    fullname: value.fullname,
    password: hashedPassword,
  });

  res.send(new ApiResponse(200, "User registered successfully", newUser));
});

// Login user
const LoginUser = asyncHandler(async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);

  if (error) {
    throw new ApiError(400, "Invalid credentials", error.details.map((d) => d.message));
  }

  const existingUser = await UserModel.findOne({ email: value.email });
  if (!existingUser) {
    throw new ApiError(400, "Invalid credentials");
  }

  const isPasswordValid = await verifyPassword(value.password, existingUser.password);
  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid credentials");
  }

  const newAccessToken = CreateAccessToken(existingUser._id, existingUser.email, existingUser.fullname);
  const newRefreshToken = CreateRefreshToken(existingUser._id, existingUser.email, existingUser.fullname);
  const resobj = { id: existingUser._id, fullname: existingUser.fullname, email: existingUser.email }
  res.cookie("accessToken", newAccessToken, {
    httpOnly: true,
    secure: false,
    maxAge: 10 * 60 * 1000,
    path: "/",
  });

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });

  res.status(200).json({
    "message": "User logged in successfully",
    "data": resobj
  })
});

// Logout user
const LogoutUser = asyncHandler(async (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: false,
    path: "/",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: false,
    path: "/",
  });
  res.send(new ApiResponse(200, "User logged out successfully"));
});

const UpdatePoints = async (userId, problemId) => {
  if (!userId || !problemId) {
    throw new Error("Include userId and problemId in request");
  }
  const problemData = await Problem.findById(problemId).select("difficulty");
  if (!problemData) {
    throw new Error("Problem not found");
  }
  console.log("problemData found:", problemData)
  const marksobj = {
    Easy: 10,
    Medium: 20,
    Hard: 30,
  };
  const points = marksobj[problemData.difficulty] || 0;
  const updatedUser = await UserModel.findOneAndUpdate(
    {
      _id: userId,
      "solvedTestCases.problemId": { $ne: problemId },
    },
    {
      $inc: { points: points },
      $push: {
        solvedTestCases: {
          problemId,
          submitDate: new Date(),
        },
      },
    },
    { new: true }
  );
  if (!updatedUser) {
    return { pointsAdded: false, message: "Already solved this problem" };
  }

  return { pointsAdded: true, updatedUser, pointsAddedValue: points };
};

export {
  RegisterUser, LoginUser, LogoutUser, UpdatePoints
}
// 192.168.18.26:29092 ip i want
