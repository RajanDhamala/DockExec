
import { RedisClient } from "../Utils/RedisClient.js";
import jwt from "jsonwebtoken";
import asyncHandler from "../Utils/AsyncHandler.js";
import { CreateAccessToken } from "../Utils/Authutils.js";

const AuthIdemptent = asyncHandler(async (req, res, next) => {
  const { accessToken, refreshToken } = req.cookies;
  if (!accessToken && !refreshToken) {
    return res.status(401).json({ message: "No cookies provided" });
  }
  let user;
  try {
    user = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    req.user = user;
  } catch (err) {
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token" });
    }
    try {
      const decodedRefresh = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      user = {
        id: decodedRefresh.id,
        fullname: decodedRefresh.fullname,
        email: decodedRefresh.email,
      };

      const newAccessToken = CreateAccessToken(
        user.id,
        user.email,
        user.fullname
      );

      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 10 * 60 * 1000,
        path: "/",
      });

      req.user = user;
    } catch (err) {
      return res.status(401).json({ message: "Cookies expired or invalid" });
    }
  }

  const key = req.headers["idempotency-key"];
  if (!key) {
    return res.status(400).json({ message: "Missing idempotency key" });
  }

  const redisKey = `idempotency:${req.user.id}:${key}`;

  const lock = await RedisClient.set(
    redisKey,
    JSON.stringify({ status: "IN_PROGRESS" }),
    { NX: true, EX: 300 }
  );

  if (!lock) {
    const cached = await RedisClient.get(redisKey);
    return res.status(409).json({
      message: "Duplicate request with same idempotency key",
      data: cached,
    });
  }

  res.on("finish", async () => {
    await RedisClient.set(
      redisKey,
      JSON.stringify({ status: "COMPLETED" }),
      { EX: 300 }
    );
  });

  next();
});
export default AuthIdemptent;
