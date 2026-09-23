import { Pool, type QueryResultRow } from 'pg'
import type { ExchangeRequest, Message, Session, Skill, User } from './data.js'

export const databaseUrl = process.env.DATABASE_URL
export const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null

export async function query<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  if (!pool) throw new Error('DATABASE_URL is not configured')
  return pool.query<T>(text, values)
}

function userFromRow(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    bio: String(row.bio ?? ''),
    initials: String(row.initials),
    accent: String(row.avatar_color),
    location: String(row.location),
    availability: String(row.availability),
    skillsOffered: Array.isArray(row.skills_offered) ? row.skills_offered.map(String) : [],
    skillsWanted: Array.isArray(row.skills_wanted) ? row.skills_wanted.map(String) : [],
    passwordHash: String(row.password_hash),
  }
}

export function mapUser(row: Record<string, unknown>) {
  return userFromRow(row)
}

export function mapSkill(row: Record<string, unknown>): Skill {
  return {
    id: String(row.id),
    name: String(row.name),
    category: String(row.category),
    level: String(row.level),
    rating: Number(row.rating),
    reviews: Number(row.reviews),
    userId: String(row.user_id),
    user: String(row.user_name),
    initials: String(row.initials),
    accent: String(row.avatar_color),
    availability: String(row.availability),
    offered: String(row.offered),
    type: row.skill_type === 'wanted' ? 'wanted' : 'offered',
  }
}

export function mapRequest(row: Record<string, unknown>): ExchangeRequest {
  return {
    id: String(row.id),
    skillId: String(row.skill_id),
    skillName: String(row.skill_name),
    fromUserId: String(row.requester_id),
    toUserId: String(row.recipient_id),
    fromUser: String(row.requester_name),
    toUser: String(row.recipient_name),
    status: row.status as ExchangeRequest['status'],
    createdAt: new Date(String(row.created_at)).toISOString(),
    message: String(row.message),
  }
}

export function mapMessage(row: Record<string, unknown>): Message {
  return {
    id: String(row.id),
    fromUserId: String(row.sender_id),
    toUserId: String(row.recipient_id),
    content: String(row.content),
    createdAt: new Date(String(row.created_at)).toISOString(),
  }
}

export function mapSession(row: Record<string, unknown>): Session {
  return {
    id: String(row.id),
    title: String(row.title),
    with: String(row.partner_name),
    date: String(row.session_date),
    time: String(row.session_time),
    mode: String(row.mode),
    color: String(row.color),
  }
}

export async function ensureDatabase() {
  if (!pool) return

  await query(`
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
  `)

  await query(`
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
      skill_type TEXT NOT NULL DEFAULT 'offered',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS exchange_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending',
      message TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (skill_id, requester_id, recipient_id)
    );
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `)

  await query(`
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
  `)
}
