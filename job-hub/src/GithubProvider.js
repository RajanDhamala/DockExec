
import crypto from "crypto";
import RedisLimiter from "./Middlewares/RedisLimitMiddleware.js";

// Generate random state for CSRF protection
const generateState = () => crypto.randomBytes(16).toString("hex");

const GithubProvider = (app, clientId, clientSecret, redirectUrl, onSuccess, onError) => {
  app.get("/auth/github", (req, res) => {
    const state = generateState();
    res.cookie("github_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 5 * 60 * 1000, // 5 min
    });

    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUrl);
    url.searchParams.set("scope", "user:email");
    url.searchParams.set("state", state);

    res.redirect(url.toString());
  });

  // Step 2: Callback from GitHub
  app.get("/auth/github/callback", RedisLimiter("oauthLogin"), async (req, res) => {
    const { code, state } = req.query;
    const storedState = req.cookies.github_oauth_state;

    if (!code || !state || state !== storedState) {
      return res.status(400).send("Invalid OAuth state");
    }

    res.clearCookie("github_oauth_state");

    try {
      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUrl,
        }),
      });

      if (!tokenRes.ok) throw new Error("Token exchange failed");
      const { access_token: accessToken } = await tokenRes.json();
      if (!accessToken) throw new Error("No access token");

      const [userRes, emailRes] = await Promise.all([
        fetch("https://api.github.com/user", {
          headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "YourApp" },
        }),
        fetch("https://api.github.com/user/emails", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      if (!userRes.ok || !emailRes.ok) throw new Error("Failed to fetch user info");

      const userData = await userRes.json();
      const emails = await emailRes.json();
      const primaryEmail = emails.find(e => e.primary && e.verified)?.email || userData.email;

      const userInfo = {
        userData,
        email: primaryEmail,
        accessToken,
        provider: "github",
      };

      if (onSuccess) await onSuccess(req, res, userInfo);
      else res.json(userInfo);
    } catch (err) {
      console.error("GitHub OAuth Error:", err);
      if (onError) await onError(req, res, err);
      else res.status(500).json({ error: "GitHub OAuth failed" });
    }
  });
};

const GoogleProvider = (app, clientId, clientSecret, redirectUrl, onSuccess, onError) => {
  // Step 1: Redirect to Google
  app.get("/auth/google", (req, res) => {
    const state = generateState();
    res.cookie("google_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 5 * 60 * 1000,
    });

    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUrl);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "profile email");
    url.searchParams.set("state", state);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");

    res.redirect(url.toString());
  });

  app.get("/auth/google/callback", async (req, res) => {
    const { code, state } = req.query;
    const storedState = req.cookies.google_oauth_state;

    if (!code || !state || state !== storedState) {
      return res.status(400).send("Invalid OAuth state");
    }

    res.clearCookie("google_oauth_state");

    try {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUrl,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenRes.ok) throw new Error("Token exchange failed");
      const { access_token: accessToken } = await tokenRes.json();
      if (!accessToken) throw new Error("No access token");

      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!userRes.ok) throw new Error("Failed to fetch user info");
      const userData = await userRes.json();

      const userInfo = {
        userData,
        email: userData.email,
        accessToken,
        provider: "google",
      };

      if (onSuccess) await onSuccess(req, res, userInfo);
      else res.json(userInfo);
    } catch (err) {
      console.error("Google OAuth Error:", err);
      if (onError) await onError(req, res, err);
      else res.status(500).json({ error: "Google OAuth failed" });
    }
  });
};

export { GithubProvider, GoogleProvider }
