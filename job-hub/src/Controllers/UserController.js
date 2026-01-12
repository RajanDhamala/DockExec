import asyncHandler from "../Utils/AsyncHandler.js"
import LeaderBoard from "../Schemas/LeaderBoardSchema.js"
import { RedisClient } from "../Utils/RedisClient.js"
import mongoose from "mongoose"
import ApiError from "../Utils/ApiError.js"
import ApiResponse from "../Utils/ApiResponse.js"
import Joi from "joi"
import { hashPassword, verifyPassword, CreateAccessToken, CreateRefreshToken } from "../Utils/Authutils.js"
import UserModel from "../Schemas/UserSchema.js"
import Problem from "../Schemas/CodeSchema.js"
import TestCase from "../Schemas/TestCaseSchema.js"
import TrialRunner from "../Schemas/TrialSchema.js"
import RawExecution from "../Schemas/RawSchema.js"


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

const getYourLocation = asyncHandler(async (req, res) => {
  const user = req.user
  let userLocation
  try {
    userLocation = await UserModel.findOne({ _id: user.id }).select("location.coordinates")
  } catch (err) {
    console.log("faild to read user location", err)
    return res.send("errir")
  }
  if (!userLocation) throw new ApiError(400, null, "user not found")
  if (!userLocation.location.coordinates) throw new ApiError(400, null, "coordinated undefined")
  return res.send(new ApiResponse(200, "successfully fetched user coordinates", userLocation))
})

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



const GeturPoints = asyncHandler(async (req, res) => {
  const user = req.user;

  const userDoc = await UserModel.findById(user.id).select("points");
  const userPoints = userDoc?.points || 0;

  let statsStr = await RedisClient.get("leaderboardStats");
  let stats;

  if (statsStr) {
    stats = JSON.parse(statsStr);
  } else {
    stats = await LeaderBoard.findOne({}).sort({ createdAt: -1 }).lean();
    if (!stats) return res.status(500).send({ message: "Leaderboard not ready" });

    console.log("DB stats:", stats);

    await RedisClient.set("leaderboardStats", JSON.stringify(stats));
  }

  const { pointsHistogram, totalUsers } = stats;

  let usersBelow = 0;
  for (const bucket of pointsHistogram) {
    if (userPoints > bucket.max) {
      usersBelow += bucket.count;
    } else if (userPoints >= bucket.min && userPoints <= bucket.max) {
      const bucketRange = bucket.max - bucket.min + 1;
      const pointsInBucket = userPoints - bucket.min;
      const proportion = pointsInBucket / bucketRange;
      usersBelow += bucket.count * proportion;
      break;
    } else {
      break;
    }
  }

  const percentile = (usersBelow / totalUsers) * 100;

  return res.send(new ApiResponse(200, "Successfully fetched user percentile", { topPercentile: Math.round(percentile * 100) / 100 }));
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

const getLeaderboard = asyncHandler(async (req, res) => {
  const topUsers = await UserModel.aggregate([
    { $sort: { points: -1 } },
    { $limit: 10 },
    { $project: { name: 1, points: 1, avatar: 1, fullname: 1 } }
  ]);
  return res.json({
    "data": topUsers
  })
})

const getUserBasicMetrics = asyncHandler(async (req, res) => {
  const user = req.user;
  const days = Number(req.params.days);

  if (!user || !days || isNaN(days)) {
    throw new ApiError(400, null, "please include valid token and days");
  }

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  // rn the query is not optmized later will be optimized with better approch and code

  // solvedCount for the user
  const userData = await UserModel.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(user.id) } },
    {
      $project: {
        _id: 0,
        fullname: 1,
        solvedCount: {
          $size: {
            $ifNull: [
              {
                $filter: {
                  input: "$solvedTestCases",
                  as: "tc",
                  cond: { $gte: ["$$tc.submitDate", fromDate] }
                }
              },
              []
            ]
          }
        }
      }
    }
  ]);

  const metrics = await TestCase.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(user.id), createdAt: { $gte: fromDate } } },
    {
      $facet: {
        totalRuns: [{ $count: "count" }],
        topLanguages: [
          { $group: { _id: "$language", totalCount: { $sum: 1 } } },
          { $sort: { totalCount: -1 } },
          { $limit: 3 }
        ]
      }
    }
  ]);

  console.log(metrics);

  const sucessCount = await TestCase.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(user.id),
        status: { $in: ["success", "failed"] },
        createdAt: { $gte: fromDate }
      }
    },
    {
      $group: {
        _id: "$status",       // group only by status
        count: { $sum: 1 }    // total per status
      }
    }
  ])

  const totalruns = metrics[0].totalRuns[0]?.count || 0;
  const topLanguages = metrics[0].topLanguages;

  return res.status(200).json(
    new ApiResponse(
      200,
      "successfully fetched the profile metrics",
      { totalruns, topLanguages, solvedCount: userData[0]?.solvedCount, "success": sucessCount[0], "failed": sucessCount[1], }
    )
  );
});


const getUserProblemAnalytics = async (userId, problemId) => {
  try {
    const results = await TestCase.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          problemId: new mongoose.Types.ObjectId(problemId),
        },
      },
      { $unwind: "$testCases" },
      { $match: { "testCases.isPassed": true } },
      {
        $group: {
          _id: {
            language: "$language",
            testCaseNumber: "$testCases.testCaseNumber",
          },
          avgExecutionTime: { $avg: "$testCases.duration" },
          successRuns: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          language: "$_id.language",
          testCaseNumber: "$_id.testCaseNumber",
          avgExecutionTime: { $round: ["$avgExecutionTime", 4] },
          successRuns: 1,
        },
      },
      { $sort: { language: 1, testCaseNumber: 1 } },
    ]);

    return results;
  } catch (err) {
    console.error("Error fetching user analytics:", err);
    return [];
  }
};


const AvgExectionTimeMetrics = asyncHandler(async (req, res) => {

  const user = req.user
  const { language, problemId } = req.params

  if (!language || !problemId) {
    throw new ApiError(404, null, "please inlcude language and problemId")
  }

  const metrics = await getUserProblemAnalytics(user.id, problemId)
  return res.send(new ApiResponse(200, "succesfully fetched profile metrics", metrics))

})

const fillEmptyMonths = (metrics, months = 6) => {
  const now = new Date();
  const result = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);

    const existing = metrics.find(
      (e) => e.year === d.getFullYear() && e.month === d.getMonth() + 1
    );

    result.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      submissions: existing ? existing.submissions : 0,
      avgExecutionTime: existing ? existing.avgExecutionTime : 0
    });
  }

  return result;
};

const exeMetrics = asyncHandler(async (req, res) => {
  const user = req.user

  const now = new Date();
  const pipeline = [
    { $match: { userId: new mongoose.Types.ObjectId(user.id) } },
    {
      $project: {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
        execution_time: 1
      }
    },
    {
      $group: {
        _id: { year: "$year", month: "$month" },
        submissions: { $sum: 1 },
        avgExecutionTime: { $avg: "$execution_time" }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
        submissions: 1,
        avgExecutionTime: { $round: ["$avgExecutionTime", 4] }
      }
    }
  ];
  const pipeline2 = [
    { $match: { userId: new mongoose.Types.ObjectId(user.id) } },
    {
      $project: {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
        execution_time: { $avg: "$testCases.duration" } // average per document
      }
    },
    {
      $group: {
        _id: { year: "$year", month: "$month" },
        submissions: { $sum: 1 },
        avgExecutionTime: { $avg: "$execution_time" }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
        submissions: 1,
        avgExecutionTime: { $round: ["$avgExecutionTime", 4] }
      }
    }
  ];

  const pipeline3 = [
    { $match: { userId: new mongoose.Types.ObjectId(user.id) } },
    {
      $project: {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
        execution_time: 1
      }
    },
    {
      $group: {
        _id: { year: "$year", month: "$month" },
        submissions: { $sum: 1 },
        avgExecutionTime: { $avg: "$execution_time" }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
        submissions: 1,
        avgExecutionTime: { $round: ["$avgExecutionTime", 4] }
      }
    }
  ];

  const PrintCaseMetrics = await TrialRunner.aggregate(pipeline);
  const TestCasesMetrics = await TestCase.aggregate(pipeline2);
  const ProgrammizMetrics = await RawExecution.aggregate(pipeline3);
  return res.json({
    PrintCase: fillEmptyMonths(PrintCaseMetrics),
    TestCases: fillEmptyMonths(TestCasesMetrics),
    Programmiz: fillEmptyMonths(ProgrammizMetrics)
  });
})




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
  RegisterUser, LoginUser, LogoutUser, UpdatePoints, ChangeUserAvatar, UpdateProfile, getYourLocation, UpdateUserCoordinates, GeturPoints, getUsersNearYou, getLeaderboard, AvgExectionTimeMetrics, exeMetrics, DeleteAccount, getUserBasicMetrics
}
// 192.168.18.26:29092 ip i want
