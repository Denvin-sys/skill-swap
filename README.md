# SkillSwap

SkillSwap is a polished full-stack MVP for peer-to-peer skill exchanges. It includes a responsive React + Vite dashboard and a small Express API with a PostgreSQL-ready data model.

## Quick start

Requirements: Node.js 18+, npm, and PostgreSQL 14+.

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The API runs at [http://localhost:4000](http://localhost:4000).

## PostgreSQL setup

1. Create a database:

```sql
CREATE DATABASE skillswap;
```

2. Apply the schema from the project root:

```bash
psql -U postgres -d skillswap -f server/schema.sql
```

3. Copy `server/.env.example` to `server/.env` and set your PostgreSQL password and a strong JWT secret:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/skillswap
JWT_SECRET=your-long-random-secret
PORT=4000
```

4. Start the app:

```bash
npm run dev
```

When `DATABASE_URL` is present, the API uses PostgreSQL and seeds the demo users and skills the first time the database is empty. Without it, the API uses the in-memory fallback.

Demo login:

- Email: `yuna@skillswap.dev`
- Password: `skillswap123`

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

The server supports both PostgreSQL and an in-memory fallback. PostgreSQL data is stored in the users, skills, exchange_requests, messages, and sessions tables. The frontend API contracts remain unchanged between both modes.

## Product notes

The current dashboard includes skill discovery with search, exchange request actions with confirmation feedback, stats, upcoming sessions, learning progress, recent activity, navigation, and responsive layouts for tablet and mobile widths.
