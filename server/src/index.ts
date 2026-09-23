import 'dotenv/config'
import bcrypt from 'bcryptjs'
import cors from 'cors'
import express from 'express'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import { messages, requests, sessions, skills, users, type User } from './data.js'
import { databaseUrl, ensureDatabase, mapMessage, mapRequest, mapSession, mapSkill, mapUser, query } from './db.js'

const app = express()
const port = Number(process.env.PORT ?? 4000)
const JWT_SECRET = process.env.JWT_SECRET ?? 'skill-swap-demo-secret'
const useDatabase = Boolean(databaseUrl)

app.use(cors())
app.use(express.json())

function toPublicUser(user: User) {
  const { passwordHash: _passwordHash, ...safeUser } = user
  return { ...safeUser, stats: { exchangesCompleted: 24, skillsLearned: 8, communityHours: 36 } }
}

function createToken(user: User) {
  return jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
}

function getMemoryUserById(id: string | undefined) {
  return users.find((user) => user.id === id)
}

function getMemoryUserByEmail(email: string | undefined) {
  return users.find((user) => user.email.toLowerCase() === String(email ?? '').toLowerCase())
}

async function seedDatabase() {
  if (!useDatabase) return
  const count = await query<{ count: string }>('SELECT count(*)::text AS count FROM users')
  if (Number(count.rows[0].count) > 0) return

  for (const user of users) {
    await query(
      `INSERT INTO users (id, name, email, password_hash, bio, initials, avatar_color, location, availability, skills_offered, skills_wanted)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb)`,
      [user.name, user.email, user.passwordHash, user.bio, user.initials, user.accent, user.location, user.availability, JSON.stringify(user.skillsOffered), JSON.stringify(user.skillsWanted)],
    )
  }

  for (const skill of skills) {
    await query(
      `INSERT INTO skills (owner_id, name, category, level, rating, reviews, availability, offered, skill_type)
       SELECT id, $1, $2, $3, $4, $5, $6, $7, $8 FROM users WHERE email = $9`,
      [skill.name, skill.category, skill.level, skill.rating, skill.reviews, skill.availability, skill.offered, skill.type, users.find((user) => user.id === skill.userId)?.email],
    )
  }
}

app.get('/api/health', async (_req, res) => {
  if (!useDatabase) {
    res.json({ status: 'ok', database: 'in-memory fallback', timestamp: new Date().toISOString() })
    return
  }

  try {
    await query('SELECT 1')
    res.json({ status: 'ok', database: 'postgresql', timestamp: new Date().toISOString() })
  } catch {
    res.status(503).json({ status: 'error', database: 'postgresql unavailable' })
  }
})

app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password, bio = '' } = req.body ?? {}
  if (!name || !email || !password) {
    res.status(400).json({ error: 'name, email, and password are required' })
    return
  }
  if (String(password).length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters long' })
    return
  }

  const passwordHash = await bcrypt.hash(String(password), 10)
  const initials = String(name).split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'SK'

  if (useDatabase) {
    try {
      const result = await query<Record<string, unknown>>(
        `INSERT INTO users (name, email, password_hash, bio, initials)
         VALUES ($1, lower($2), $3, $4, $5)
         RETURNING *`,
        [String(name), String(email), passwordHash, String(bio), initials],
      )
      const user = mapUser(result.rows[0])
      res.status(201).json({ user: toPublicUser(user), token: createToken(user) })
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        res.status(409).json({ error: 'User already exists' })
        return
      }
      res.status(500).json({ error: 'Unable to create account' })
    }
    return
  }

  if (getMemoryUserByEmail(email)) {
    res.status(409).json({ error: 'User already exists' })
    return
  }

  const newUser: User = {
    id: crypto.randomUUID(),
    name: String(name),
    email: String(email),
    bio: String(bio),
    initials,
    accent: ['#91b9cc', '#f2b880', '#c8b4d9', '#98c2a8'][users.length % 4],
    location: 'New city',
    availability: 'Flexible',
    skillsOffered: [],
    skillsWanted: [],
    passwordHash,
  }
  users.push(newUser)
  res.status(201).json({ user: toPublicUser(newUser), token: createToken(newUser) })
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body ?? {}
  if (!password) {
    res.status(400).json({ error: 'Password is required' })
    return
  }

  if (useDatabase) {
    const result = await query<Record<string, unknown>>('SELECT * FROM users WHERE lower(email) = lower($1)', [String(email)])
    if (!result.rows[0]) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    const user = mapUser(result.rows[0])
    if (!(await bcrypt.compare(String(password), user.passwordHash))) {
      res.status(401).json({ error: 'Invalid password' })
      return
    }
    res.json({ user: toPublicUser(user), token: createToken(user) })
    return
  }

  const user = getMemoryUserByEmail(email)
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  if (!(await bcrypt.compare(String(password), user.passwordHash))) {
    res.status(401).json({ error: 'Invalid password' })
    return
  }
  res.json({ user: toPublicUser(user), token: createToken(user) })
})

app.get('/api/users', async (_req, res) => {
  if (useDatabase) {
    const result = await query<Record<string, unknown>>('SELECT * FROM users ORDER BY created_at')
    res.json(result.rows.map((row) => toPublicUser(mapUser(row))))
    return
  }
  res.json(users.map(toPublicUser))
})

app.put('/api/users/me', async (req, res) => {
  const { id, name, bio, location, availability } = req.body ?? {}
  if (useDatabase) {
    const result = await query<Record<string, unknown>>(
      `UPDATE users SET name = COALESCE($1, name), bio = COALESCE($2, bio), location = COALESCE($3, location), availability = COALESCE($4, availability)
       WHERE id = $5 RETURNING *`,
      [name, bio, location, availability, id],
    )
    if (!result.rows[0]) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json(toPublicUser(mapUser(result.rows[0])))
    return
  }
  const user = getMemoryUserById(id)
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  user.name = name ?? user.name
  user.bio = bio ?? user.bio
  user.location = location ?? user.location
  user.availability = availability ?? user.availability
  res.json(toPublicUser(user))
})

app.get('/api/skills', async (req, res) => {
  const search = String(req.query.search ?? '').trim()
  const category = String(req.query.category ?? '').trim()
  if (useDatabase) {
    const result = await query<Record<string, unknown>>(
      `SELECT s.*, u.name AS user_name, u.initials, u.avatar_color
       FROM skills s JOIN users u ON u.id = s.owner_id
       WHERE ($1 = '' OR lower(s.name || ' ' || s.category || ' ' || u.name) LIKE lower('%' || $1 || '%'))
         AND ($2 = '' OR lower(s.category) = lower($2))
       ORDER BY s.created_at DESC`,
      [search, category],
    )
    res.json(result.rows.map(mapSkill))
    return
  }
  res.json(skills.filter((skill) => (!search || `${skill.name} ${skill.category} ${skill.user}`.toLowerCase().includes(search.toLowerCase())) && (!category || skill.category.toLowerCase() === category.toLowerCase())))
})

app.post('/api/skills', async (req, res) => {
  const { userId, name, category, level, type = 'offered', availability = 'Flexible' } = req.body ?? {}
  if (!userId || !name || !category || !level) {
    res.status(400).json({ error: 'userId, name, category, and level are required' })
    return
  }
  if (useDatabase) {
    const result = await query<Record<string, unknown>>(
      `WITH inserted AS (
        INSERT INTO skills (owner_id, name, category, level, availability, offered, skill_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
      )
      SELECT inserted.*, u.name AS user_name, u.initials, u.avatar_color
      FROM inserted JOIN users u ON u.id = inserted.owner_id`,
      [userId, String(name), String(category), String(level), String(availability), type === 'offered' ? 'Skill exchange' : 'Learning this skill', type === 'wanted' ? 'wanted' : 'offered'],
    )
    if (!result.rows[0]) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.status(201).json(mapSkill(result.rows[0]))
    return
  }
  const user = getMemoryUserById(userId)
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  const skill = { id: crypto.randomUUID(), name: String(name), category: String(category), level: String(level), rating: 4.8, reviews: 0, userId: String(userId), user: user.name, initials: user.initials, accent: user.accent, availability: String(availability), offered: type === 'offered' ? 'Skill exchange' : 'Learning this skill', type: type === 'wanted' ? 'wanted' as const : 'offered' as const }
  skills.push(skill)
  ;(type === 'offered' ? user.skillsOffered : user.skillsWanted).push(String(name))
  res.status(201).json(skill)
})

app.get('/api/requests', async (req, res) => {
  const userId = String(req.query.userId ?? '')
  if (useDatabase) {
    const result = await query<Record<string, unknown>>(
      `SELECT r.*, s.name AS skill_name, sender.name AS requester_name, recipient.name AS recipient_name
       FROM exchange_requests r JOIN skills s ON s.id = r.skill_id
       JOIN users sender ON sender.id = r.requester_id JOIN users recipient ON recipient.id = r.recipient_id
       WHERE $1 = '' OR r.requester_id = $1::uuid OR r.recipient_id = $1::uuid
       ORDER BY r.created_at DESC`,
      [userId],
    )
    res.json(result.rows.map(mapRequest))
    return
  }
  res.json(userId ? requests.filter((request) => request.fromUserId === userId || request.toUserId === userId) : requests)
})

app.post('/api/requests', async (req, res) => {
  const { skillId, fromUserId, toUserId, message = 'I would love to learn this skill.' } = req.body ?? {}
  if (!skillId || !fromUserId || !toUserId) {
    res.status(400).json({ error: 'skillId, fromUserId, and toUserId are required' })
    return
  }
  if (useDatabase) {
    const result = await query<Record<string, unknown>>(
      `INSERT INTO exchange_requests (skill_id, requester_id, recipient_id, message)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (skill_id, requester_id, recipient_id) DO UPDATE SET message = EXCLUDED.message
       RETURNING id`,
      [skillId, fromUserId, toUserId, String(message)],
    )
    const request = await query<Record<string, unknown>>(
      `SELECT r.*, s.name AS skill_name, sender.name AS requester_name, recipient.name AS recipient_name
       FROM exchange_requests r JOIN skills s ON s.id = r.skill_id
       JOIN users sender ON sender.id = r.requester_id JOIN users recipient ON recipient.id = r.recipient_id
       WHERE r.id = $1`,
      [result.rows[0].id],
    )
    res.status(201).json(mapRequest(request.rows[0]))
    return
  }
  const sender = getMemoryUserById(fromUserId)
  const recipient = getMemoryUserById(toUserId)
  const skill = skills.find((entry) => entry.id === String(skillId))
  if (!sender || !recipient || !skill) {
    res.status(404).json({ error: 'Sender, recipient, or skill not found' })
    return
  }
  const existing = requests.find((entry) => entry.skillId === String(skillId) && entry.fromUserId === sender.id && entry.toUserId === recipient.id)
  if (existing) {
    res.json(existing)
    return
  }
  const request = { id: crypto.randomUUID(), skillId: String(skillId), skillName: skill.name, fromUserId: sender.id, toUserId: recipient.id, toUser: recipient.name, fromUser: sender.name, status: 'pending' as const, createdAt: new Date().toISOString(), message: String(message) }
  requests.push(request)
  res.status(201).json(request)
})

app.patch('/api/requests/:id/status', async (req, res) => {
  const { status } = req.body ?? {}
  if (!['pending', 'accepted', 'declined'].includes(String(status))) {
    res.status(400).json({ error: 'status must be pending, accepted, or declined' })
    return
  }
  if (useDatabase) {
    const result = await query<Record<string, unknown>>('UPDATE exchange_requests SET status = $1 WHERE id = $2 RETURNING id', [status, req.params.id])
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Request not found' })
      return
    }
    const request = await query<Record<string, unknown>>(
      `SELECT r.*, s.name AS skill_name, sender.name AS requester_name, recipient.name AS recipient_name
       FROM exchange_requests r JOIN skills s ON s.id = r.skill_id JOIN users sender ON sender.id = r.requester_id JOIN users recipient ON recipient.id = r.recipient_id WHERE r.id = $1`,
      [req.params.id],
    )
    res.json(mapRequest(request.rows[0]))
    return
  }
  const request = requests.find((entry) => entry.id === req.params.id)
  if (!request) {
    res.status(404).json({ error: 'Request not found' })
    return
  }
  request.status = status
  res.json(request)
})

app.get('/api/messages', async (req, res) => {
  const { userId, peerId } = req.query
  if (!userId) {
    res.status(400).json({ error: 'userId is required' })
    return
  }
  if (useDatabase) {
    const result = peerId
      ? await query<Record<string, unknown>>(
        `SELECT * FROM messages
         WHERE (sender_id = $1::uuid OR recipient_id = $1::uuid)
           AND ((sender_id = $2::uuid AND recipient_id = $1::uuid)
             OR (sender_id = $1::uuid AND recipient_id = $2::uuid))
         ORDER BY created_at`,
        [String(userId), String(peerId)],
      )
      : await query<Record<string, unknown>>(
        `SELECT * FROM messages
         WHERE sender_id = $1::uuid OR recipient_id = $1::uuid
         ORDER BY created_at`,
        [String(userId)],
      )
    res.json(result.rows.map(mapMessage))
    return
  }
  res.json(messages.filter((message) => (message.fromUserId === String(userId) || message.toUserId === String(userId)) && (!peerId || (message.fromUserId === String(peerId) && message.toUserId === String(userId)) || (message.fromUserId === String(userId) && message.toUserId === String(peerId)))))
})

app.post('/api/messages', async (req, res) => {
  const { fromUserId, toUserId, content } = req.body ?? {}
  if (!fromUserId || !toUserId || !content) {
    res.status(400).json({ error: 'fromUserId, toUserId, and content are required' })
    return
  }
  if (useDatabase) {
    const result = await query<Record<string, unknown>>('INSERT INTO messages (sender_id, recipient_id, content) VALUES ($1, $2, $3) RETURNING *', [fromUserId, toUserId, String(content).trim()])
    res.status(201).json(mapMessage(result.rows[0]))
    return
  }
  const message = { id: crypto.randomUUID(), fromUserId: String(fromUserId), toUserId: String(toUserId), content: String(content).trim(), createdAt: new Date().toISOString() }
  messages.push(message)
  res.status(201).json(message)
})

app.get('/api/sessions', async (_req, res) => {
  if (useDatabase) {
    const result = await query<Record<string, unknown>>('SELECT * FROM sessions ORDER BY created_at DESC')
    res.json(result.rows.map(mapSession))
    return
  }
  res.json(sessions)
})

app.post('/api/sessions', async (req, res) => {
  const { title, with: partner, date, time, mode = 'Video call', color = '#91b9cc', requestId } = req.body ?? {}
  if (!title || !partner || !date || !time) {
    res.status(400).json({ error: 'title, with, date, and time are required' })
    return
  }
  if (useDatabase) {
    const result = await query<Record<string, unknown>>('INSERT INTO sessions (request_id, title, partner_name, session_date, session_time, mode, color) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [requestId ?? null, String(title), String(partner), String(date), String(time), String(mode), String(color)])
    if (requestId) await query('UPDATE exchange_requests SET status = $1 WHERE id = $2', ['accepted', requestId])
    res.status(201).json(mapSession(result.rows[0]))
    return
  }
  if (requestId) {
    const request = requests.find((entry) => entry.id === String(requestId))
    if (request) request.status = 'accepted'
  }
  const session = { id: crypto.randomUUID(), title: String(title), with: String(partner), date: String(date), time: String(time), mode: String(mode), color: String(color) }
  sessions.push(session)
  res.status(201).json(session)
})

async function start() {
  if (useDatabase) {
    await ensureDatabase()
    await seedDatabase()
  }
  app.listen(port, () => {
    console.log(`SkillSwap API listening on http://localhost:${port}`)
    console.log(useDatabase ? 'Using PostgreSQL database.' : 'Using in-memory data. Set DATABASE_URL to enable PostgreSQL.')
  })
}

void start().catch((error) => {
  console.error('Unable to start SkillSwap API:', error)
  process.exitCode = 1
})
