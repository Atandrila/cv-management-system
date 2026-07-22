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

export function getCurrentUser(request, response) {
  response.json({ success: true, authenticated: Boolean(request.user), data: request.user ? formatUser(request.user) : null, oauthAvailability });
}

export function handleOAuthSuccess(_request, response) {
  response.redirect(`${process.env.APP_URL || process.env.CLIENT_URL || "http://localhost:5000"}?login=success`);
}

export async function demoLogin(request, response, next) {
  try {
    if (process.env.NODE_ENV === "production") return response.status(404).json({ success: false, message: "Not found." });
    const role = ["CANDIDATE", "RECRUITER", "ADMIN"].includes(request.body.role) ? request.body.role : "CANDIDATE";
    const user = await prisma.user.findUnique({ where: { email: `${role.toLowerCase()}@demo.local` } });
    if (!user || user.isBlocked) return response.status(403).json({ success: false, message: "Demo user is unavailable. Run npm run setup." });
    request.login(await getUserWithRoles(user.id), (error) => {
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
