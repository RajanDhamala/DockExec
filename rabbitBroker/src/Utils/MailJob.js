import nodemailer from "nodemailer"
import dotenv from "dotenv"

dotenv.config({})

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_ADDR,
    pass: process.env.GMAIL_PASS,
  },
});

const ForgotPassword = async (name, link, toEmail) => {
  if (!toEmail || !link || !name) {
    console.log(name, link, toEmail)
    console.error("Missing required email parameters.");
    return;
  }
  const subject = "Reset Your DockExe Password";
  const body = `
  <div style="font-family: Arial, sans-serif; line-height:1.6; color: #333;">
    <h2 style="color: #1E90FF;">Hello ${name},</h2>
    <p>You recently requested to reset your DockExe password. Click the button below to set a new password:</p>

    <p style="text-align: center; margin: 30px 0;">
      <a href="${link}" 
         style="background-color: #1E90FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Reset Password
      </a>
    </p>

    <p>If you did not request a password reset, you can safely ignore this email.</p>

    <p>Thanks,<br/>The <strong>DockExe</strong> Team</p>

    <hr style="border:none; border-top:1px solid #eee; margin: 20px 0;" />

    <small style="color: #888;">
      This link will expire in 5 minutes for security purposes.
    </small>
  </div>
  `;

  const mailOptions = {
    from: process.env.GMAIL_ADDR,
    to: toEmail,
    subject,
    html: body,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Forgot password email sent to ${toEmail}`);
  } catch (error) {
    console.error(`Error sending email to ${toEmail}:`, error);
  }
};


const ReviewEmail = async (name, toEmail, link) => {
  if (!name || !toEmail) return;

  const subject = "We Miss You at DockExe!";

  const body = `
  <div style="font-family: Arial, sans-serif; line-height:1.6; color: #333;">
    <h2 style="color: #1E90FF;">Hey ${name},</h2>
    <p>We noticed you haven't visited DockExe for a while. We’d love to hear from you!</p>

    <p>Your feedback helps us make DockExe better for coders like you. What stopped you from visiting?</p>

    <p style="text-align: center; margin: 30px 0;">
      <a href="${link}" 
         style="background-color: #1E90FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Give Feedback
      </a>
    </p>

    <p>We appreciate your input and can’t wait to make your coding experience even better!</p>

    <p>Thanks,<br/><strong>DockExe Team</strong></p>
  </div>
  `;

  const mailOptions = {
    from: process.env.GMAIL_ADDR,
    to: toEmail,
    subject,
    html: body,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Re-engagement email sent to ${toEmail}`);
  } catch (error) {
    console.error(`Error sending email to ${toEmail}:`, error);
  }
};


const ReconnectEmail = async (name, problemName, problemUrl, points, toEmail) => {
  if (!name || !problemName || !problemUrl || !points || !toEmail) {
    return;
  }

  const subject = `Solve "${problemName}" and Earn ${points} Points!`;

  const body = `
  <div style="font-family: Arial, sans-serif; line-height:1.6; color: #333;">
    <h2 style="color: #1E90FF;">Hi ${name},</h2>
    <p>We noticed you haven’t solved "<strong>${problemName}</strong>" yet.</p>

    <p>By solving this problem, you can increase your <strong>${points} points</strong> and level up on DockExe!</p>

    <p style="text-align: center; margin: 30px 0;">
      <a href="${problemUrl}" 
         style="background-color: #1E90FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Solve Now
      </a>
    </p>

    <p>Don't miss the chance to improve your skills and climb the leaderboard!</p>

    <p>Happy coding,<br/><strong>DockExe Team</strong></p>
  </div>
  `;

  const mailOptions = {
    from: process.env.GMAIL_ADDR,
    to: toEmail,
    subject,
    html: body,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Reconnect email sent to ${toEmail}`);
  } catch (error) {
    console.error(`Error sending email to ${toEmail}:`, error);
  }
};


export { ForgotPassword, ReviewEmail, ReconnectEmail }
