# SkillSwap

SkillSwap is a polished full-stack MVP for peer-to-peer skill exchanges. It includes a responsive React + Vite dashboard and a small Express API with a PostgreSQL-ready data model.

## Quick start

Requirements: Node.js 18+ and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The API runs at [http://localhost:4000](http://localhost:4000).

## Scripts

- `npm run dev` starts the Vite client and Express API together.
- `npm run build` type-checks and builds both workspaces.
- `npm run check` runs TypeScript checks without emitting files.
- `npm start` runs the compiled API.

## API

- `GET /api/health`
- `GET /api/skills?search=&category=`
- `GET /api/users/me`
- `GET|POST /api/requests`
- `GET|POST /api/sessions`

The server intentionally uses an in-memory repository so it runs without external services or credentials. Data resets when the server restarts. `server/schema.sql` documents the PostgreSQL tables, relationships, enums, indexes, and UUID strategy needed for a production adapter. To add a database adapter later, set `DATABASE_URL` and replace the repository functions in `server/src/data.ts`; no frontend API contracts need to change.

## Product notes

The current dashboard includes skill discovery with search, exchange request actions with confirmation feedback, stats, upcoming sessions, learning progress, recent activity, navigation, and responsive layouts for tablet and mobile widths.
