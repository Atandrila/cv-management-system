import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import prisma from "./database.js";

export const userWithRoles = {
  roles: { include: { role: true } },
};

export async function getUserWithRoles(userId) {
  return prisma.user.findUnique({ where: { id: userId }, include: userWithRoles });
}

export function isBootstrapAdminEmail(email) {
  const configuredEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return configuredEmails.includes(String(email || "").trim().toLowerCase());
}

async function applyConfiguredRoles(user) {
  if (!isBootstrapAdminEmail(user.email)) return user;
  const admin = await prisma.role.findUnique({ where: { name: "ADMIN" } });
  if (!admin) throw new Error("Run the database seed before signing in.");
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: admin.id } },
    update: {},
    create: { userId: user.id, roleId: admin.id },
  });
  return getUserWithRoles(user.id);
}

async function ensureSocialUser({ provider, providerAccountId, email, firstName, lastName, photoUrl }) {
  const linked = await prisma.socialAccount.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId } },
    include: { user: { include: userWithRoles } },
  });
  if (linked) return applyConfiguredRoles(linked.user);

  const candidate = await prisma.role.findUnique({ where: { name: "CANDIDATE" } });
  if (!candidate) throw new Error("Run the database seed before signing in.");

  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: {
      socialAccounts: { create: { provider, providerAccountId } },
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      photoUrl: photoUrl || undefined,
    },
    create: {
      email: email.toLowerCase(), firstName, lastName, photoUrl,
      socialAccounts: { create: { provider, providerAccountId } },
      roles: { create: { roleId: candidate.id } },
    },
    include: userWithRoles,
  });
  return applyConfiguredRoles(user);
}

async function githubEmail(accessToken, profile) {
  const included = profile.emails?.find((item) => item.value)?.value;
  if (included) return included;
  const response = await fetch("https://api.github.com/user/emails", {
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${accessToken}`, "User-Agent": "cv-management-system" },
  });
  if (!response.ok) throw new Error("GitHub did not provide a verified email address.");
  const emails = await response.json();
  return emails.find((item) => item.primary && item.verified)?.email
    || emails.find((item) => item.verified)?.email
    || Promise.reject(new Error("GitHub did not provide a verified email address."));
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await getUserWithRoles(id);
    done(null, user && !user.isBlocked ? user : false);
  } catch (error) { done(error); }
});

const configured = (...names) => names.every((name) => {
  const value = process.env[name]?.trim();
  return value && !/your-|replace-with/i.test(value);
});
export const oauthAvailability = {
  github: configured("GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"),
  google: configured("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"),
};

if (oauthAvailability.github) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL || "http://localhost:5000/api/auth/github/callback",
    state: true,
  }, async (accessToken, _refresh, profile, done) => {
    try {
      const email = await githubEmail(accessToken, profile);
      const parts = (profile.displayName || profile.username || "GitHub User").trim().split(/\s+/);
      const user = await ensureSocialUser({
        provider: "github", providerAccountId: String(profile.id), email,
        firstName: parts[0], lastName: parts.slice(1).join(" ") || null,
        photoUrl: profile.photos?.[0]?.value || null,
      });
      done(null, user.isBlocked ? false : user);
    } catch (error) { done(error); }
  }));
}

if (oauthAvailability.google) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
    state: true,
  }, async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.find((item) => item.verified !== false)?.value;
      if (!email) throw new Error("Google did not provide a verified email address.");
      const user = await ensureSocialUser({
        provider: "google", providerAccountId: String(profile.id), email,
        firstName: profile.name?.givenName || profile.displayName || "Google User",
        lastName: profile.name?.familyName || null,
        photoUrl: profile.photos?.[0]?.value || null,
      });
      done(null, user.isBlocked ? false : user);
    } catch (error) { done(error); }
  }));
}

export default passport;
