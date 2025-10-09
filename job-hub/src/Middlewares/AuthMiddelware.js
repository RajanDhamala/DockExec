
import jwt from "jsonwebtoken";
import asyncHandler from "../Utils/AsyncHandler.js";
import { CreateAccessToken } from "../Utils/Authutils.js";
import dotenv from "dotenv";

dotenv.config();

const AuthUser = asyncHandler(async (req, res, next) => {
  const { accessToken, refreshToken } = req.cookies;
  if (!accessToken && !refreshToken) {
    return res.status(401).json({ message: "No cookies provided" });
  }

  try {
    // Try verifying access token
    const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    req.user = decodedToken;
    return next();
  } catch (err) {
    console.log("Access token expired or invalid:", err.message);
  }

  // Try refresh token
  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token" });
  }

  try {
    const decodedRefresh = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Use info from decodedRefresh to recreate user info
    const user = {
      id: decodedRefresh.id,
      fullname: decodedRefresh.fullname,
      email: decodedRefresh.email,
    };

    // Create new access token
    const newAccessToken = CreateAccessToken(user.id,user.email,user.fullname);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: false,
      maxAge: 10 * 60 * 1000,
      path: "/",
    });

    req.user = user;
    return next();
  } catch (err) {
    console.log("Refresh token expired or invalid:", err.message);
    return res.status(401).json({ message: "Cookies expired or invalid" });
  }
});

export default AuthUser;
