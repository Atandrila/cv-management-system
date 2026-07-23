import cors from "cors";
import connectPgSimple from "connect-pg-simple";
import express from "express";
import session from "express-session";
import helmet from "helmet";
import morgan from "morgan";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import passport from "./config/passport.js";
import prisma from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import apiRoutes from "./routes/apiRoutes.js";

const app = express();
const publicAppUrl = process.env.APP_URL || "http://localhost:5000";
const PostgresSessionStore = connectPgSimple(session);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: [process.env.APP_URL || "http://localhost:5000", process.env.CLIENT_URL || "http://localhost:5173"], credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));
app.use(session({
  name: "cv.sid",
  secret: process.env.SESSION_SECRET || "local-development-change-this-secret",
  resave: false,
  saveUninitialized: false,
  store: new PostgresSessionStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
  }),
  cookie: { httpOnly: true, secure: process.env.NODE_ENV === "production" && publicAppUrl.startsWith("https://"), sameSite: "lax", maxAge: 7 * 24 * 60 * 60 * 1000 },
}));
app.use(passport.initialize());
app.use(passport.session());

app.get("/api/health", (_request, response) => response.json({ success: true, message: "CV Management API is running", timestamp: new Date().toISOString() }));
app.get("/api/health/database", async (_request, response, next) => { try { response.json({ success: true, message: "PostgreSQL database connected successfully", userCount: await prisma.user.count() }); } catch (error) { next(error); } });
app.use("/api/auth", authRoutes);
app.use("/api", apiRoutes);
const clientDist = resolve(dirname(fileURLToPath(import.meta.url)), "../../client/dist");
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((request, response, next) => {
    if (request.method === "GET" && !request.path.startsWith("/api")) return response.sendFile(resolve(clientDist, "index.html"));
    return next();
  });
}
app.use((request, response) => response.status(404).json({ success: false, message: `Route not found: ${request.method} ${request.originalUrl}` }));
app.use((error, _request, response, _next) => {
  console.error(error);
  if (error.code === "P2002") return response.status(409).json({ success: false, message: "A record with that unique value already exists." });
  if (error.code === "P2025") return response.status(404).json({ success: false, message: "Record not found." });
  response.status(error.status || 500).json({ success: false, message: process.env.NODE_ENV === "production" ? "Internal server error" : error.message });
});

export default app;
