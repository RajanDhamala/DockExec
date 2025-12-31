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

const ChangeUserAvatar = asyncHandler(async (req, res) => {
  const avatarUrl = req.file.path;
  const Userdata = await UserModel.findOne({ _id: req.user.id }).select("avatar")
  if (!Userdata) {
    throw new ApiError(400, null, "user profile not found")
  }
  Userdata.avatar = avatarUrl
  Userdata.save()
  return res.send(new ApiResponse(200, "user avatar changed successfully", { url: avatarUrl }))
})


const UpdateProfile = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, null, "Unauthorized");

  const { fullname, bio, dob } = req.body;

  const usrProfile = await UserModel.findById(userId);
  if (!usrProfile) throw new ApiError(404, null, "User profile not found");

  if (fullname) usrProfile.fullname = fullname;
  if (bio) usrProfile.bio = bio;
  if (dob) usrProfile.dob = dob;

  await usrProfile.save();

  return res.status(200).json(
    new ApiResponse(200, "Successfully updated user profile", usrProfile)
  );
});


const isValidLatitude = (lat) => typeof lat === "number" && lat >= -90 && lat <= 90;
const isValidLongitude = (lng) => typeof lng === "number" && lng >= -180 && lng <= 180;

const UpdateUserCoordinates = asyncHandler(async (req, res) => {
  const user = req.user;
  let { latitude, longitude } = req.body;

  if (latitude === undefined || longitude === undefined) {
    throw new ApiError(400, null, "Please include latitude and longitude in body");
  }

  latitude = Number(latitude);
  longitude = Number(longitude);

  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
    throw new ApiError(400, null, "Invalid coordinates. Latitude must be -90..90, longitude -180..180");
  }

  const userExist = await UserModel.findById(user.id);
  if (!userExist) {
    throw new ApiError(404, null, "User not found");
  }

  userExist.location = {
    type: "Point",
    coordinates: [longitude, latitude]
  };

  await userExist.save();

  return res.send(new ApiResponse(200, "Successfully updated user coordinates"));
});



const getUsersNearYou = asyncHandler(async (req, res) => {
  const user = req.user;
  const maxDistance = 5000; // 5 km

  const userdata = await UserModel.findById(user.id);
  if (!userdata?.location?.coordinates) {
    throw new ApiError(400, null, "User location not set");
  }

  const [lng, lat] = userdata.location.coordinates;

  const neardata = await UserModel.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng, lat]
        },
        distanceField: "distance",
        maxDistance: maxDistance,
        spherical: true,
        query: { _id: { $ne: user.id } }
      }
    },
    { $sort: { points: -1 } },
    { $limit: 10 },
    {
      $project: {
        _id: 1,
        fullname: 1,
        points: 1,
        avatar: 1
      }
    }
  ]);

  return res.send(
    new ApiResponse(200, "fetched nearby top users", neardata)
  );
});


const DeleteAccount = asyncHandler(async (req, res) => {
  const user = req.user
  const userDel = await UserModel.findByIdAndDelete({ _id: user.id })
  if (!userDel) {
    throw new ApiError(500, null, "failed to delete user account")
  }
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
  return res.send(new ApiError(200, "successfully deleted user account", { really: true }))
})



export {
  RegisterUser, LoginUser, LogoutUser, UpdatePoints, ChangeUserAvatar, UpdateProfile, UpdateUserCoordinates, getUsersNearYou, DeleteAccount
}
// 192.168.18.26:29092 ip i want
