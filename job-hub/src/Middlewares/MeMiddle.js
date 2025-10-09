import asyncHandler from "../Utils/AsyncHandler.js";
import { CreateAccessToken } from "../Utils/Authutils.js";
import jwt from "jsonwebtoken";

import dotenv from "dotenv";

dotenv.config();

const Whoareu = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken } = req.cookies;

  if (!accessToken && !refreshToken) {
    return res.status(401).json({ message: "Access denied" });
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    return res.json({ success: true, user: decoded });
  } catch (err) {
    console.log("Access token expired:", err.message);
  }

  // Try refresh if access failed
  try {
    const decodedRefresh = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = {
      id: decodedRefresh.id, // not _id
      fullname: decodedRefresh.fullname,
      email: decodedRefresh.email,
    };

    const newAccessToken = CreateAccessToken(user.fullname, user.id, user.email);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: false,
      maxAge: 10 * 60 * 1000,
      path: "/",
    });

    return res.json({ success: true, user });
  } catch (err) {
    console.log("Refresh token expired:", err.message);
    return res.status(401).json({ message: "Cookies expired or invalid" });
  }
});

export default Whoareu