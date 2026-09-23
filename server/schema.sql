-- SkillSwap PostgreSQL schema.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'declined', 'completed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  initials VARCHAR(3) NOT NULL,
  avatar_color VARCHAR(7) NOT NULL DEFAULT '#91b9cc',
  location TEXT NOT NULL DEFAULT 'New city',
  availability TEXT NOT NULL DEFAULT 'Flexible',
  skills_offered JSONB NOT NULL DEFAULT '[]'::jsonb,
  skills_wanted JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  level TEXT NOT NULL,
  rating NUMERIC(3,2) NOT NULL DEFAULT 4.8,
  reviews INTEGER NOT NULL DEFAULT 0,
  availability TEXT NOT NULL DEFAULT 'Flexible',
  offered TEXT NOT NULL DEFAULT 'Skill exchange',
  skill_type TEXT NOT NULL DEFAULT 'offered' CHECK (skill_type IN ('offered', 'wanted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exchange_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status request_status NOT NULL DEFAULT 'pending',
  message TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (skill_id, requester_id, recipient_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES exchange_requests(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  partner_name TEXT NOT NULL,
  session_date TEXT NOT NULL,
  session_time TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'Video call',
  color VARCHAR(7) NOT NULL DEFAULT '#91b9cc',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS skills_category_idx ON skills(category);
CREATE INDEX IF NOT EXISTS requests_requester_idx ON exchange_requests(requester_id);
CREATE INDEX IF NOT EXISTS requests_recipient_idx ON exchange_requests(recipient_id);
CREATE INDEX IF NOT EXISTS messages_thread_idx ON messages(sender_id, recipient_id, created_at);
CREATE INDEX IF NOT EXISTS sessions_created_at_idx ON sessions(created_at);
