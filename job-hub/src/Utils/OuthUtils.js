
import User from "../Schemas/UserSchema.js";
import asyncHandler from "../Utils/AsyncHandler.js";
import { CreateAccessToken, CreateRefreshToken } from "./Authutils.js";

const setAuthCookies = (res, user) => {
  const accessToken = CreateAccessToken(user._id, user.email, user.fullname);
  const refreshToken = CreateRefreshToken(user._id, user.email, user.fullname);

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: false,
    maxAge: 10 * 60 * 1000, // 10 minutes
    path: "/",
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });
};


const loginOrLinkUser = asyncHandler(async (data, res, providerField) => {
  const providerId = data.userData.id;

  let user = await User.findOne({ [providerField]: providerId });

  if (!user) {
    user = await User.findOne({ email: data.email });

    if (user) {
      user[providerField] = providerId;
      user.avatar = user.avatar || data.userData.avatar_url;
      user.fullname = user.fullname || data.userData.name;
      await user.save();
    } else {
      user = await User.create({
        email: data.email,
        fullname: data.userData.name,
        avatar: data.userData.avatar_url,
        [providerField]: providerId,
        password: null
      });
    }
  }

  setAuthCookies(res, user);

  return res.redirect(process.env.FRONTEND_URI || "http://localhost:5173/");
});

export { loginOrLinkUser };


