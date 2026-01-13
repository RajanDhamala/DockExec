import { ForgotPassword, ReviewEmail, ReconnectEmail } from "./MailJob.js"
import { RedisClient } from "./ConnectRedis.js";
import crypto from "crypto";

const handelEmail = async (data, msg, channel) => {
  const key = `lock:${data.type}:${data.email}`;

  const isLocked = await RedisClient.set(key, JSON.stringify(data), {
    NX: true,
    PX: 2 * 60 * 1000,
  });

  if (!isLocked) {
    console.log("Lock already acquired, skipping job");
    channel.ack(msg);
    return;
  }

  if (data.type == "reset-password") {
    console.log("password reset link to be sent")
    const hashedToken = crypto
      .createHash("sha256")
      .update(data.token)
      .digest("hex");
    await RedisClient.set(`pwd-reset:${data.token}`, JSON.stringify({ hashedToken, "ip": data.ip, "email": data.email }), { EX: 2 * 60 })
    const templink = `http://localhost:5173/password-reset/${data.token}`
    await ForgotPassword(data.fullname, templink, data.email)
    channel.ack(msg)
  }
  else if (data.type == "review-mail") {
    console.log("we got review mail btw")
    const templink = `http://localhost:5173/review`
    ReviewEmail(data.fullname, data.email, templink)
    channel.ack(msg)
    return
  }
  else if (data.type == "reconnect-mail") {
    const templink = `http://localhost:5173/leet}`

    for (const item of data.data.inactiveUsers) {
      console.log(
        "userId:", item.userId,
        "tokenUsed:", item.tokenUsed,
        "fullname:", item.fullname,
        "points:", item.points,
        "email:", item.email
      );

      await ReconnectEmail(item.fullname, "Two Sum", templink, `${item.points}`, item.email);
    }
    channel.ack(msg)
    return
  }
  else {
    channel.ack(msg)
    return
  }
}

export { handelEmail }







