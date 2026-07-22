# CV Forge - CV Management System

A complete React + Express recruitment platform built for the course-project specification in `Course Project.docx`. It uses a normalized Prisma data model and a local SQLite database, so the full application and demo accounts run without any paid service.

## Included features

- Three roles: Candidate, Recruiter, and Administrator
- Optional GitHub and Google OAuth, plus local demo login for zero-configuration testing
- Reusable typed attribute library with categories, dropdown options, prefix lookup, recent-use ordering, and optimistic locking
- Shared recruiter-managed position templates, duplication, access rules, attributes, tags, project limits, and optimistic locking
- Candidate profile with six-second auto-save, conflict handling, reusable attributes, Markdown project descriptions, and technology tags
- Live CV generation from profile values (CV content is not copied into JSON), one CV per candidate/position, drafts, completeness validation, publishing, and print/PDF styling
- Position discussions refreshed every three seconds and recruiter CV likes
- Public dashboard, statistics, tag cloud, tables for positions/CVs, and SQLite FTS5 full-text position search
- Admin selection toolbar for blocking, unblocking, deleting, assigning roles, and removing roles
- English/Bengali UI preference, light/dark themes, responsive Bootstrap layout
- Selection toolbars instead of repeated edit/delete buttons in table rows

## Requirements

- Node.js 20 or newer
- npm

No PostgreSQL server, cloud database, image server, or paid API is required. SQLite stores data in `server/prisma/dev.db` and external photo URLs keep images outside the app server.

## First-time setup

Open PowerShell in this project folder:

```powershell
cd C:\Users\User\Desktop\itransition\cv-management-system
npm install --prefix server
npm install --prefix client
npm run setup
```

`npm run setup` generates the Prisma client, creates the SQLite database when needed, initializes the FTS5 search index, and seeds sample data. It is safe to run again.

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

The login page provides Candidate, Recruiter, and Admin demo buttons. They work immediately and require no password or external account.

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
GITHUB_CLIENT_ID=your-real-client-id
GITHUB_CLIENT_SECRET=your-real-client-secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
GOOGLE_CLIENT_ID=your-real-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-real-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

For a Google consent screen in testing mode, add the Gmail addresses that will test the application as test users. Restart `npm start` after changing `.env`.

OAuth buttons remain disabled until their matching client ID and secret are configured. The local demo login remains available in development.

## Verification

```powershell
npm test
```

This runs backend unit tests, frontend linting, and the Vite production build. Useful health checks while the API is running:

- `http://localhost:5000/api/health`
- `http://localhost:5000/api/health/database`

To inspect every physical SQLite table and its row count:

```powershell
npm --prefix server run db:inspect
```

## Project structure

```text
client/                 React 19 + Vite + Bootstrap UI
server/src/             Express API, authentication, authorization, domain routes
server/prisma/          Normalized Prisma schema, SQLite initializer, seed data
server/tests/           Domain/access-rule unit tests
Course Project.docx     Original assignment
```
