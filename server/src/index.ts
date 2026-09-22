import 'dotenv/config'
import bcrypt from 'bcryptjs'
import cors from 'cors'
import express from 'express'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'
import { messages, requests, sessions, skills, users, type User } from './data.js'

const app = express()
const port = Number(process.env.PORT ?? 4000)
const JWT_SECRET = process.env.JWT_SECRET ?? 'skill-swap-demo-secret'

app.use(cors())
app.use(express.json())

function getUserById(userId: string | undefined): User | undefined {
  return users.find((user) => user.id === userId)
}

function getUserByEmail(email: string | undefined): User | undefined {
  return users.find((user) => user.email.toLowerCase() === String(email ?? '').toLowerCase())
}

function toPublicUser(user: User) {
  const { passwordHash: _passwordHash, ...safeUser } = user

  return {
    ...safeUser,
    stats: {
      exchangesCompleted: 24,
      skillsLearned: 8,
      communityHours: 36,
    },
  }
}

function createToken(user: User) {
  return jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', database: 'in-memory fallback', timestamp: new Date().toISOString() })
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

  if (getUserByEmail(email)) {
    res.status(409).json({ error: 'User already exists' })
    return
  }

  const passwordHash = await bcrypt.hash(String(password), 10)

  const newUser: User = {
    id: randomUUID(),
    name: String(name),
    email: String(email),
    bio: String(bio),
    initials: String(name).split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'SK',
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
  const user = getUserByEmail(email)

  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  if (!password) {
    res.status(400).json({ error: 'Password is required' })
    return
  }

  const passwordMatches = await bcrypt.compare(String(password), user.passwordHash)

  if (!passwordMatches) {
    res.status(401).json({ error: 'Invalid password' })
    return
  }

  res.json({ user: toPublicUser(user), token: createToken(user) })
})

app.get('/api/users', (_req, res) => {
  res.json(users.map((user) => toPublicUser(user)))
})

app.get('/api/users/me', (req, res) => {
  const email = String(req.query.email ?? 'yuna@skillswap.dev')
  const user = getUserByEmail(email)

  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  res.json(toPublicUser(user))
})

app.put('/api/users/me', (req, res) => {
  const { id, name, bio, location, availability } = req.body ?? {}
  const user = getUserById(id)

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

app.get('/api/skills', (req, res) => {
  const search = String(req.query.search ?? '').toLowerCase().trim()
  const category = String(req.query.category ?? '').toLowerCase().trim()

  const result = skills.filter((skill) => {
    const matchesSearch = !search || `${skill.name} ${skill.category} ${skill.user}`.toLowerCase().includes(search)
    const matchesCategory = !category || skill.category.toLowerCase() === category
    return matchesSearch && matchesCategory
  })

  res.json(result)
})

app.post('/api/skills', (req, res) => {
  const { userId, name, category, level, type = 'offered', availability = 'Flexible' } = req.body ?? {}

  if (!userId || !name || !category || !level) {
    res.status(400).json({ error: 'userId, name, category, and level are required' })
    return
  }

  const user = getUserById(userId)
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  const skill: (typeof skills)[number] = {
    id: randomUUID(),
    name: String(name),
    category: String(category),
    level: String(level),
    rating: 4.8,
    reviews: 0,
    userId: String(userId),
    user: user.name,
    initials: user.initials,
    accent: user.accent,
    availability: String(availability),
    offered: type === 'offered' ? 'Skill exchange' : 'Learning this skill',
    type: type === 'wanted' ? 'wanted' : 'offered',
  }

  skills.push(skill)

  if (type === 'offered') {
    user.skillsOffered.push(String(name))
  } else {
    user.skillsWanted.push(String(name))
  }

  res.status(201).json(skill)
})

app.get('/api/requests', (req, res) => {
  const { userId } = req.query
  const user = typeof userId === 'string' ? getUserById(userId) : undefined

  const filtered = user
    ? requests.filter((request) => request.fromUserId === user.id || request.toUserId === user.id)
    : requests

  res.json(filtered)
})

app.post('/api/requests', (req, res) => {
  const { skillId, fromUserId, toUserId, toUser, fromUser, message = 'I would love to learn this skill.' } = req.body ?? {}

  if (!skillId || (!toUserId && !toUser)) {
    res.status(400).json({ error: 'skillId and recipient are required' })
    return
  }

  const recipient = toUserId ? getUserById(toUserId) : users.find((user) => user.name === String(toUser))
  const sender = fromUserId ? getUserById(fromUserId) : users.find((user) => user.name === String(fromUser))

  if (!recipient || !sender) {
    res.status(404).json({ error: 'Recipient or sender not found' })
    return
  }

  const skillName = skills.find((skill) => skill.id === String(skillId))?.name ?? 'Skill exchange'
  const existing = requests.find((request) => request.skillId === String(skillId) && request.fromUserId === sender.id && request.toUserId === recipient.id)

  if (existing) {
    res.status(200).json(existing)
    return
  }

  const request = {
    id: randomUUID(),
    skillId: String(skillId),
    skillName,
    fromUserId: sender.id,
    toUserId: recipient.id,
    toUser: recipient.name,
    fromUser: sender.name,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
    message: String(message),
  }

  requests.push(request)
  res.status(201).json(request)
})

app.patch('/api/requests/:id/status', (req, res) => {
  const { status } = req.body ?? {}
  const request = requests.find((entry) => entry.id === req.params.id)

  if (!request) {
    res.status(404).json({ error: 'Request not found' })
    return
  }

  if (!['pending', 'accepted', 'declined'].includes(String(status))) {
    res.status(400).json({ error: 'status must be pending, accepted, or declined' })
    return
  }

  request.status = String(status) as 'pending' | 'accepted' | 'declined'
  res.json(request)
})

app.get('/api/messages', (req, res) => {
  const { userId, peerId } = req.query

  if (!userId) {
    res.status(400).json({ error: 'userId is required' })
    return
  }

  const thread = messages.filter((message) => {
    const matchesUser = message.fromUserId === String(userId) || message.toUserId === String(userId)
    const matchesPeer = !peerId ||
      (message.fromUserId === String(peerId) && message.toUserId === String(userId)) ||
      (message.fromUserId === String(userId) && message.toUserId === String(peerId))

    return matchesUser && matchesPeer
  })

  res.json(thread)
})

app.post('/api/messages', (req, res) => {
  const { fromUserId, toUserId, content } = req.body ?? {}

  if (!fromUserId || !toUserId || !content) {
    res.status(400).json({ error: 'fromUserId, toUserId, and content are required' })
    return
  }

  const sender = getUserById(String(fromUserId))
  const recipient = getUserById(String(toUserId))

  if (!sender || !recipient) {
    res.status(404).json({ error: 'Sender or recipient not found' })
    return
  }

  const message = {
    id: randomUUID(),
    fromUserId: String(fromUserId),
    toUserId: String(toUserId),
    content: String(content).trim(),
    createdAt: new Date().toISOString(),
  }

  messages.push(message)
  res.status(201).json(message)
})

app.get('/api/sessions', (_req, res) => {
  res.json(sessions)
})

app.post('/api/sessions', (req, res) => {
  const { title, with: partner, date, time, mode = 'Video call', color = '#91b9cc', requestId } = req.body ?? {}

  if (!title || !partner || !date || !time) {
    res.status(400).json({ error: 'title, with, date, and time are required' })
    return
  }

  if (requestId) {
    const matchedRequest = requests.find((request) => request.id === String(requestId))
    if (matchedRequest) {
      matchedRequest.status = 'accepted'
    }
  }

  const session = {
    id: randomUUID(),
    title: String(title),
    with: String(partner),
    date: String(date),
    time: String(time),
    mode: String(mode),
    color: String(color),
  }

  sessions.push(session)
  res.status(201).json(session)
})

app.listen(port, () => {
  console.log(`SkillSwap API listening on http://localhost:${port}`)
  console.log('Using in-memory data. Set DATABASE_URL when wiring a PostgreSQL adapter.')
})
