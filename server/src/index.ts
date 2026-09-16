import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { randomUUID } from 'node:crypto'
import { requests, sessions, skills } from './data.js'

const app = express()
const port = Number(process.env.PORT ?? 4000)

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', database: 'in-memory fallback', timestamp: new Date().toISOString() })
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

app.get('/api/users/me', (_req, res) => {
  res.json({
    id: 'user-yuna',
    name: 'Yuna James',
    initials: 'YJ',
    bio: 'Curious maker and lifelong learner.',
    skillsOffered: ['Brand strategy', 'Content writing'],
    skillsWanted: ['Product photography', 'Spanish'],
    stats: { exchangesCompleted: 24, skillsLearned: 8, communityHours: 36 },
  })
})

app.get('/api/requests', (_req, res) => {
  res.json(requests)
})

app.post('/api/requests', (req, res) => {
  const { skillId, toUser } = req.body ?? {}
  if (!skillId || !toUser) {
    res.status(400).json({ error: 'skillId and toUser are required' })
    return
  }
  const existing = requests.find((request) => request.skillId === skillId && request.toUser === toUser)
  if (existing) {
    res.status(200).json(existing)
    return
  }
  const request = { id: randomUUID(), skillId: String(skillId), toUser: String(toUser), status: 'pending' as const, createdAt: new Date().toISOString() }
  requests.push(request)
  res.status(201).json(request)
})

app.get('/api/sessions', (_req, res) => {
  res.json(sessions)
})

app.post('/api/sessions', (req, res) => {
  const { title, with: partner, date, time, mode = 'Video call', color = '#91b9cc' } = req.body ?? {}
  if (!title || !partner || !date || !time) {
    res.status(400).json({ error: 'title, with, date, and time are required' })
    return
  }
  const session = { id: randomUUID(), title: String(title), with: String(partner), date: String(date), time: String(time), mode: String(mode), color: String(color) }
  sessions.push(session)
  res.status(201).json(session)
})

app.listen(port, () => {
  console.log(`SkillSwap API listening on http://localhost:${port}`)
  console.log('Using in-memory data. Set DATABASE_URL when wiring a PostgreSQL adapter.')
})
