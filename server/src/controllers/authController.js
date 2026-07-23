import bcrypt from "bcryptjs";
import prisma from "../config/database.js";
import { getUserWithRoles, oauthAvailability } from "../config/passport.js";

export function formatUser(user) {
  return {
    id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName,
    location: user.location, photoUrl: user.photoUrl, isBlocked: user.isBlocked,
    preferredLanguage: user.preferredLanguage, preferredTheme: user.preferredTheme,
    version: user.version, roles: user.roles.map((item) => item.role.name),
  };
}

export function isDemoLoginEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.DEMO_LOGIN_ENABLED?.toLowerCase() === "true";
}

export function isEvaluationLoginEnabled() {
  return process.env.EVALUATION_LOGIN_ENABLED?.toLowerCase() === "true";
}

export function getCurrentUser(request, response) {
  response.json({
    success: true,
    authenticated: Boolean(request.user),
    data: request.user ? formatUser(request.user) : null,
    oauthAvailability,
    demoLoginAvailable: isDemoLoginEnabled(),
    evaluationLoginAvailable: isEvaluationLoginEnabled(),
  });
}

export function handleOAuthSuccess(_request, response) {
  response.redirect(`${process.env.APP_URL || process.env.CLIENT_URL || "http://localhost:5000"}?login=success`);
}

export async function demoLogin(request, response, next) {
  try {
    if (!isDemoLoginEnabled()) return response.status(404).json({ success: false, message: "Not found." });
    const role = ["CANDIDATE", "RECRUITER", "ADMIN"].includes(request.body.role) ? request.body.role : "CANDIDATE";
    const user = await prisma.user.findUnique({ where: { email: `${role.toLowerCase()}@demo.local` } });
    if (!user || user.isBlocked) return response.status(403).json({ success: false, message: "Demo user is unavailable. Run npm run setup." });
    request.login(await getUserWithRoles(user.id), (error) => {
      if (error) return next(error);
      response.json({ success: true, data: formatUser(request.user) });
    });
  } catch (error) { next(error); }
}

export async function evaluationLogin(request, response, next) {
  try {
    if (!isEvaluationLoginEnabled()) return response.status(404).json({ success: false, message: "Not found." });
    const email = String(request.body.email || "").trim().toLowerCase();
    const password = String(request.body.password || "");
    if (!email || !password || password.length > 256) {
      return response.status(401).json({ success: false, message: "Invalid evaluation email or password." });
    }

    const account = await prisma.user.findUnique({ where: { email } });
    const valid = account?.isEvaluationAccount
      && account.passwordHash
      && await bcrypt.compare(password, account.passwordHash);
    if (!valid) return response.status(401).json({ success: false, message: "Invalid evaluation email or password." });
    if (account.isBlocked) return response.status(403).json({ success: false, message: "This evaluation account is blocked." });

    const user = await getUserWithRoles(account.id);
    request.login(user, (error) => {
      if (error) return next(error);
      response.json({ success: true, data: formatUser(request.user) });
    });
  } catch (error) { next(error); }
}

export function logout(request, response, next) {
  request.logout((error) => {
    if (error) return next(error);
    request.session.destroy((sessionError) => {
      if (sessionError) return next(sessionError);
      response.clearCookie("cv.sid");
      response.json({ success: true, message: "Signed out successfully." });
    });
  });
}
