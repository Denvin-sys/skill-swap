-- PostgreSQL-oriented schema for a production adapter.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'declined', 'completed');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  bio TEXT DEFAULT '',
  initials VARCHAR(3) NOT NULL,
  avatar_color VARCHAR(7) NOT NULL DEFAULT '#91b9cc',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  level TEXT NOT NULL,
  description TEXT DEFAULT '',
  availability TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE exchange_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  offered_skill TEXT NOT NULL,
  status request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (requester_id, skill_id)
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES exchange_requests(id) ON DELETE SET NULL,
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  mode TEXT NOT NULL DEFAULT 'Video call',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX skills_category_idx ON skills(category);
CREATE INDEX sessions_starts_at_idx ON sessions(starts_at);
