import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import passport, { oauthAvailability } from "../config/passport.js";
import { demoLogin, evaluationLogin, getCurrentUser, logout } from "../controllers/authController.js";

const router = Router();
const appUrl = process.env.APP_URL || process.env.CLIENT_URL || "http://localhost:5000";
const failedUrl = (provider, reason = "authentication_failed") => `${appUrl}/login?login=failed&provider=${provider}&reason=${encodeURIComponent(reason)}`;
const unavailable = (provider) => (_request, response) => response.redirect(failedUrl(provider.toLowerCase(), "not_configured"));
const evaluationLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: "Too many failed evaluation logins. Try again in 15 minutes." },
});

function completeOAuth(provider) {
  return (request, response, next) => {
    passport.authenticate(provider, (error, user, info) => {
      if (error || !user) return response.redirect(failedUrl(provider, error?.message || info?.message));
      return request.logIn(user, (loginError) => {
        if (loginError) return next(loginError);
        return response.redirect(`${appUrl}/?login=success&provider=${provider}`);
      });
    })(request, response, next);
  };
}

router.get("/github", oauthAvailability.github ? passport.authenticate("github", { scope: ["user:email"] }) : unavailable("GitHub"));
router.get("/github/callback", oauthAvailability.github ? completeOAuth("github") : unavailable("GitHub"));
router.get("/google", oauthAvailability.google ? passport.authenticate("google", { scope: ["profile", "email"] }) : unavailable("Google"));
router.get("/google/callback", oauthAvailability.google ? completeOAuth("google") : unavailable("Google"));
router.get("/me", getCurrentUser);
router.post("/demo", demoLogin);
router.post("/evaluation", evaluationLoginLimiter, evaluationLogin);
router.post("/logout", logout);

export default router;
