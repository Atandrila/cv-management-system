# CV Forge - CV Management System

A complete React + Express recruitment platform built for the course-project specification in `Course Project.docx`. It uses a normalized Prisma data model backed by a free Neon PostgreSQL database.

## Included features

- Three roles: Candidate, Recruiter, and Administrator
- GitHub and Google OAuth with Candidate-by-default registration and administrator-controlled staff roles
- Reusable typed attribute library with categories, dropdown options, prefix lookup, recent-use ordering, and optimistic locking
- Shared recruiter-managed position templates, duplication, access rules, attributes, tags, project limits, and optimistic locking
- Candidate profile with six-second auto-save, conflict handling, reusable attributes, Markdown project descriptions, and technology tags
- Live CV generation from profile values (CV content is not copied into JSON), one CV per candidate/position, drafts, completeness validation, publishing, and print/PDF styling
- Position discussions refreshed every three seconds and recruiter CV likes
- Public dashboard, statistics, tag cloud, tables for positions/CVs, and PostgreSQL full-text position search
- Admin selection toolbar for blocking, unblocking, deleting, assigning roles, and removing roles
- English/Bengali UI preference, light/dark themes, responsive Bootstrap layout
- Selection toolbars instead of repeated edit/delete buttons in table rows

## Requirements

- Node.js 20 or newer
- npm

A free Neon PostgreSQL project is required. Put its connection string in `server/.env` as `DATABASE_URL`. External photo URLs keep images outside the app server.

## First-time setup

Open PowerShell in this project folder:

```powershell
cd C:\Users\User\Desktop\itransition\cv-management-system
Copy-Item server\.env.example server\.env
# Put your Neon DATABASE_URL and OAuth settings in server\.env
npm install --prefix server
npm install --prefix client
npm run setup
```

`npm run setup` generates the Prisma client, applies pending PostgreSQL migrations, and seeds the initial data. It is safe to run again.

## Run the application (recommended)

The simplest and most reliable option builds the React app and serves both frontend and API from Express:

```powershell
npm start
```

Open [http://localhost:5000](http://localhost:5000). Keep the terminal open and press `Ctrl+C` to stop the application. This mode does not need a Vite proxy or a second terminal.

## Development mode

Start both the API and React client with one command:

```powershell
npm run dev
```

Keep that terminal open, then visit [http://localhost:5173](http://localhost:5173). Press `Ctrl+C` to stop both servers.

If you prefer separate terminals, use:

```powershell
npm run dev:server
npm run dev:client
```

Social sign-ins create Candidate accounts by default. Set `ADMIN_EMAILS` to your own verified Google or GitHub email to bootstrap the first administrator. That administrator can assign or remove Recruiter and Admin roles from **User Management**.

## Optional social login

Copy `server/.env.example` to `server/.env`, keep the session settings, and add credentials from free OAuth applications:

- GitHub OAuth App homepage: `http://localhost:5000`
- GitHub authorization callback: `http://localhost:5000/api/auth/github/callback`
- Google OAuth client type: **Web application**
- Google authorized JavaScript origin: `http://localhost:5000`
- Google authorized redirect URI: `http://localhost:5000/api/auth/google/callback`

Set these exact variables in `server/.env`:

```dotenv
APP_URL=http://localhost:5000
SESSION_SECRET=replace-with-a-long-random-production-secret
ADMIN_EMAILS=your-admin-google-or-github-email@example.com
DEMO_LOGIN_ENABLED=false
GITHUB_CLIENT_ID=your-real-client-id
GITHUB_CLIENT_SECRET=your-real-client-secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
GOOGLE_CLIENT_ID=your-real-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-real-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

For a Google consent screen in testing mode, add the Gmail addresses that will test the application as test users. Restart `npm start` after changing `.env`.

OAuth buttons remain disabled until their matching client ID and secret are configured. The email in `ADMIN_EMAILS` must exactly match the verified email returned by Google or GitHub. Multiple administrator emails can be comma-separated.

The passwordless demo buttons and `/api/auth/demo` endpoint are disabled by default, even in development. If you intentionally need them for local testing, set `DEMO_LOGIN_ENABLED=true`. They are always disabled when `NODE_ENV=production`.

### Role assignment after deployment

1. Put your own OAuth email in `ADMIN_EMAILS` and restart the application.
2. Sign in with that same Google or GitHub account; it receives Candidate and Admin roles.
3. Other users sign in normally and receive only the Candidate role.
4. Open **User Management**, select a user, and assign the Recruiter role when appropriate.

Users cannot select a role during login. Recruiter/Admin permissions are enforced by the backend as well as hidden in the frontend.

## Free deployment on Render

Push the repository to GitHub. `server/.env` is ignored and must never be committed.

In Render, create a **Web Service**, connect the repository, select the **Free** instance, and use:

```text
Build Command: npm run render:build
Start Command: npm run render:start
Health Check Path: /api/health
```

Add these variables in **Render → Environment**:

```dotenv
NODE_ENV=production
APP_URL=https://YOUR-SERVICE.onrender.com
CLIENT_URL=https://YOUR-SERVICE.onrender.com
DATABASE_URL=YOUR_EXISTING_NEON_CONNECTION_STRING
SESSION_SECRET=YOUR_LONG_RANDOM_SECRET
ADMIN_EMAILS=YOUR_VERIFIED_OAUTH_EMAIL
DEMO_LOGIN_ENABLED=false

GITHUB_CLIENT_ID=YOUR_PRODUCTION_GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET=YOUR_PRODUCTION_GITHUB_CLIENT_SECRET
GITHUB_CALLBACK_URL=https://YOUR-SERVICE.onrender.com/api/auth/github/callback

GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=https://YOUR-SERVICE.onrender.com/api/auth/google/callback
```

Add the Google callback URL to the existing Google web client. A GitHub OAuth app supports only one callback URL, so create a separate production GitHub OAuth app if you want localhost and Render login to work at the same time.

The build command applies only committed Prisma migrations; it does not reset the database. Login sessions are stored in PostgreSQL so they survive application restarts.

## Verification

```powershell
npm test
```

This runs backend unit tests, frontend linting, and the Vite production build. Useful health checks while the API is running:

- `http://localhost:5000/api/health`
- `http://localhost:5000/api/health/database`

To inspect every physical PostgreSQL table and its row count:

```powershell
npm --prefix server run db:inspect
```

## Project structure

```text
client/                 React 19 + Vite + Bootstrap UI
server/src/             Express API, authentication, authorization, domain routes
server/prisma/          PostgreSQL Prisma schema, migrations, and seed data
server/tests/           Domain/access-rule unit tests
Course Project.docx     Original assignment
```
