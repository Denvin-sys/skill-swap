
import { useEffect, useMemo, useState, type FormEvent } from 'react'

type User = {
  id: string
  name: string
  email: string
  bio: string
  initials: string
  accent: string
  location: string
  availability: string
  skillsOffered: string[]
  skillsWanted: string[]
  stats?: {
    exchangesCompleted: number
    skillsLearned: number
    communityHours: number
  }
}

type Skill = {
  id: string
  name: string
  category: string
  level: string
  rating: number
  reviews: number
  userId: string
  user: string
  initials: string
  accent: string
  availability: string
  offered: string
  type: 'offered' | 'wanted'
}

type Session = {
  id: string
  title: string
  with: string
  date: string
  time: string
  mode: string
  color: string
}

type ExchangeRequest = {
  id: string
  skillId: string
  skillName: string
  fromUserId: string
  toUserId: string
  fromUser: string
  toUser: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
  message: string
}

type Message = {
  id: string
  fromUserId: string
  toUserId: string
  content: string
  createdAt: string
}

type AuthMode = 'login' | 'signup'

const navItems = [
  ['Overview', '?'],
  ['Discover', '?'],
  ['My exchanges', '?'],
  ['Messages', '?'],
  ['Calendar', '?'],
]

const defaultUserEmail = 'yuna@skillswap.dev'

const fallbackSkills: Skill[] = [
  { id: 's1', name: 'Product photography', category: 'Creative', level: 'Intermediate', rating: 4.9, reviews: 18, userId: 'u3', user: 'Maya Chen', initials: 'MC', accent: '#f2b880', availability: 'This week', offered: 'Brand strategy', type: 'offered' },
  { id: 's2', name: 'React & TypeScript', category: 'Technology', level: 'Advanced', rating: 5, reviews: 24, userId: 'u2', user: 'Alex Morgan', initials: 'AM', accent: '#91b9cc', availability: 'Weekends', offered: 'UX research', type: 'offered' },
  { id: 's3', name: 'Conversational Spanish', category: 'Languages', level: 'Native', rating: 4.8, reviews: 32, userId: 'u4', user: 'Sofia Reyes', initials: 'SR', accent: '#c8b4d9', availability: 'Evenings', offered: 'Illustration', type: 'offered' },
  { id: 's4', name: 'Financial planning', category: 'Business', level: 'Advanced', rating: 4.9, reviews: 11, userId: 'u1', user: 'Yuna James', initials: 'YJ', accent: '#e7c1a9', availability: 'Mornings', offered: 'Content writing', type: 'offered' },
]

const fallbackSessions: Session[] = [
  { id: 'session-1', title: 'Portfolio review', with: 'Alex Morgan', date: 'Today', time: '4:00 PM', mode: 'Video call', color: '#91b9cc' },
  { id: 'session-2', title: 'Spanish conversation', with: 'Sofia Reyes', date: 'Tomorrow', time: '6:30 PM', mode: 'Video call', color: '#c8b4d9' },
  { id: 'session-3', title: 'Brand strategy basics', with: 'Maya Chen', date: 'Fri, Jun 14', time: '11:00 AM', mode: 'Video call', color: '#f2b880' },
]

async function fetchJson<T>(path: string, options: RequestInit = {}): Promise<T> {
const headers = new Headers(options.headers ?? {})
const token = typeof window !== 'undefined' ? window.localStorage.getItem('skillswap_token') : null

if (token && !headers.has('Authorization')) {
  headers.set('Authorization', `Bearer ${token}`)
  }

if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
  headers.set('Content-Type', 'application/json')
}

const response = await fetch(path, { ...options, headers })
const data = await response.json().catch(() => ({}))

if (!response.ok) {
  throw new Error((data as { error?: string }).error ?? 'Request failed')
}

return data as T
}

function Avatar({ initials, accent, size = 'normal' }: { initials: string; accent: string; size?: 'normal' | 'large' }) {
  return <span className={`avatar ${size}`} style={{ background: accent }}>{initials}</span>
}

function App() {
  const [activeNav, setActiveNav] = useState('Overview')
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [skills, setSkills] = useState<Skill[]>(fallbackSkills)
  const [requests, setRequests] = useState<ExchangeRequest[]>([])
  const [sessions, setSessions] = useState<Session[]>(fallbackSessions)
  const [messages, setMessages] = useState<Message[]>([])
  const [chatPeerId, setChatPeerId] = useState<string | null>(null)
  const [chatDraft, setChatDraft] = useState('')
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [toast, setToast] = useState('')
  const [authForm, setAuthForm] = useState({ name: 'Yuna James', email: defaultUserEmail, password: 'skillswap123', bio: 'Curious maker and lifelong learner.' })
  const [skillForm, setSkillForm] = useState({ name: '', category: 'Technology', level: 'Beginner', type: 'offered' as 'offered' | 'wanted' })

  useEffect(() => {
    const autoLogin = async () => {
      try {
        const response = await fetchJson<{ user: User; token: string }>('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: defaultUserEmail, password: 'skillswap123' }),
        })

        window.localStorage.setItem('skillswap_token', response.token)
        setCurrentUser(response.user)
        setAuthForm((prev) => ({ ...prev, name: response.user.name, email: response.user.email, password: 'skillswap123', bio: response.user.bio }))
      } catch {
        window.localStorage.removeItem('skillswap_token')
        setCurrentUser(null)
      }
    }

    void autoLogin()
  }, [])

  useEffect(() => {
    if (!currentUser) return

    const loadDashboard = async () => {
      const [usersData, skillsData, sessionsData, requestsData] = await Promise.all([
        fetchJson<User[]>('/api/users').catch(() => []),
        fetchJson<Skill[]>('/api/skills').catch(() => fallbackSkills),
        fetchJson<Session[]>('/api/sessions').catch(() => fallbackSessions),
        fetchJson<ExchangeRequest[]>(`/api/requests?userId=${currentUser.id}`).catch(() => []),
      ])

      setAllUsers(usersData)
      setSkills(skillsData)
      setSessions(sessionsData)
      setRequests(requestsData)

      const initialPeer = usersData.find((user) => user.id !== currentUser.id)?.id ?? null
      setChatPeerId((previous) => previous ?? initialPeer)
    }

    void loadDashboard()
  }, [currentUser])

  useEffect(() => {
    if (!currentUser || !chatPeerId) return

    const loadMessages = async () => {
      const thread = await fetchJson<Message[]>(`/api/messages?userId=${currentUser.id}&peerId=${chatPeerId}`).catch(() => [])
      setMessages(thread)
    }

    void loadMessages()
  }, [currentUser, chatPeerId])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  const filteredSkills = useMemo(() =>
    skills.filter((skill) => `${skill.name} ${skill.category} ${skill.user}`.toLowerCase().includes(query.toLowerCase())),
    [skills, query],
  )

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      const endpoint = authMode === 'signup' ? '/api/auth/signup' : '/api/auth/login'
      const payload = authMode === 'signup'
        ? { name: authForm.name, email: authForm.email, password: authForm.password, bio: authForm.bio }
        : { email: authForm.email, password: authForm.password }

      const response = await fetchJson<{ user: User; token: string }>(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      window.localStorage.setItem('skillswap_token', response.token)
      setCurrentUser(response.user)
      setToast(authMode === 'signup' ? 'Welcome to SkillSwap!' : 'Logged in successfully')
      setAuthForm((prev) => ({ ...prev, name: response.user.name, email: response.user.email, password: authForm.password, bio: response.user.bio }))
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  async function handleProfileUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!currentUser) return

    try {
      const updatedUser = await fetchJson<User>('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentUser.id,
          name: currentUser.name,
          bio: currentUser.bio,
          location: currentUser.location,
          availability: currentUser.availability,
        }),
      })

      setCurrentUser(updatedUser)
      setToast('Profile updated')
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Unable to update profile')
    }
  }

  async function handleAddSkill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!currentUser) return

    try {
      const createdSkill = await fetchJson<Skill>('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          name: skillForm.name,
          category: skillForm.category,
          level: skillForm.level,
          type: skillForm.type,
          availability: currentUser.availability,
        }),
      })

      setSkills((current) => [createdSkill, ...current])
      setSkillForm({ name: '', category: 'Technology', level: 'Beginner', type: 'offered' })
      setToast(`Added ${createdSkill.name} to your skill list`)
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Unable to add skill')
    }
  }

  async function requestExchange(skill: Skill) {
    if (!currentUser) return

    try {
      const createdRequest = await fetchJson<ExchangeRequest>('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId: skill.id,
          fromUserId: currentUser.id,
          toUserId: skill.userId,
          message: `Hi ${skill.user}, I would love to learn ${skill.name}.`,
        }),
      })

      setRequests((current) => [createdRequest, ...current])
      setToast(`Request sent to ${skill.user}`)
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Request could not be sent')
    }
  }

  async function handleRequestDecision(requestId: string, status: 'accepted' | 'declined') {
    try {
      const updatedRequest = await fetchJson<ExchangeRequest>(`/api/requests/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      setRequests((current) => current.map((request) => request.id === requestId ? updatedRequest : request))
      setToast(status === 'accepted' ? 'Exchange approved' : 'Exchange declined')
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Could not update the exchange request')
    }
  }

  async function scheduleSession(request: ExchangeRequest) {
    try {
      const session = await fetchJson<Session>('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${request.skillName} session`,
          with: request.fromUser === currentUser?.name ? request.toUser : request.fromUser,
          date: 'Tomorrow',
          time: '6:30 PM',
          mode: 'Video call',
          requestId: request.id,
        }),
      })

      setSessions((current) => [session, ...current])
      setToast(`Session booked with ${session.with}`)
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Unable to schedule the session')
    }
  }

  const chatContacts = useMemo(() => {
    const peers = new Map<string, { id: string; name: string; initials: string; accent: string }>()

    allUsers.forEach((user) => {
      if (user.id !== currentUser?.id) {
        peers.set(user.id, { id: user.id, name: user.name, initials: user.initials, accent: user.accent })
      }
    })

    requests.forEach((request) => {
      if (request.status !== 'accepted') return

      const peerId = request.fromUserId === currentUser?.id ? request.toUserId : request.toUserId === currentUser?.id ? request.fromUserId : null
      if (!peerId) return

      const peerName = request.fromUserId === currentUser?.id ? request.toUser : request.fromUser
      peers.set(peerId, {
        id: peerId,
        name: peerName,
        initials: peerName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'SK',
        accent: '#91b9cc',
      })
    })

    return Array.from(peers.values())
  }, [allUsers, currentUser, requests])

  const selectedChatContact = chatContacts.find((contact) => contact.id === chatPeerId) ?? chatContacts[0]

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!currentUser || !chatPeerId || !chatDraft.trim()) return

    try {
      const createdMessage = await fetchJson<Message>('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: currentUser.id,
          toUserId: chatPeerId,
          content: chatDraft.trim(),
        }),
      })

      setMessages((current) => [...current, createdMessage])
      setChatDraft('')
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Unable to send the message')
    }
  }

  function handleLogout() {
    window.localStorage.removeItem('skillswap_token')
    setCurrentUser(null)
    setAuthMode('login')
    setAuthForm({ name: 'Yuna James', email: defaultUserEmail, password: 'skillswap123', bio: 'Curious maker and lifelong learner.' })
    setToast('Logged out')
  }

  if (!currentUser) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="brand"><span className="brand-mark">?</span><span>skill<span>swap</span></span></div>
          <div className="auth-switch">
            <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>Login</button>
            <button className={authMode === 'signup' ? 'active' : ''} onClick={() => setAuthMode('signup')}>Sign up</button>
          </div>

          <form className="auth-form" onSubmit={handleAuthSubmit}>
            {authMode === 'signup' && (
              <label>
                Full name
                <input value={authForm.name} onChange={(event) => setAuthForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Your name" />
              </label>
            )}

            <label>
              Email address
              <input value={authForm.email} onChange={(event) => setAuthForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="you@example.com" />
            </label>

            <label>
              Password
              <input type="password" value={authForm.password} onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))} placeholder={authMode === 'signup' ? 'At least 6 characters' : 'Enter your password'} />
            </label>

            {authMode === 'signup' && (
              <label>
                Short bio
                <textarea value={authForm.bio} onChange={(event) => setAuthForm((prev) => ({ ...prev, bio: event.target.value }))} placeholder="Tell people what you love to learn or teach" />
              </label>
            )}

            <button type="submit" className="primary-button auth-submit">
              {authMode === 'signup' ? 'Create account' : 'Continue'}
            </button>
          </form>

          <p className="demo-text">Demo account: {defaultUserEmail} / password: skillswap123</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">?</span><span>skill<span>swap</span></span></div>
        <div className="workspace-label">YOUR SPACE</div>
        <nav>
          {navItems.map(([label, icon]) => (
            <button className={`nav-item ${activeNav === label ? 'active' : ''}`} key={label} onClick={() => setActiveNav(label)}>
              <span className="nav-icon">{icon}</span>{label}
              {label === 'Messages' && <span className="nav-badge">3</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item"><span className="nav-icon">?</span>Settings</button>
          <div className="profile-mini">
            <Avatar initials={currentUser.initials} accent={currentUser.accent} />
            <div>
              <strong>{currentUser.name}</strong>
              <small>View profile</small>
            </div>
            <button className="logout-button" onClick={handleLogout} aria-label="Log out">Logout</button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><b>/</b><strong>{activeNav}</strong></div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Notifications">?<i /></button>
            <div className="top-avatar">{currentUser.initials}</div>
          </div>
        </header>

        <div className="page">
        {activeNav === 'Overview' && <section className="hero">
            <div>
              <p className="eyebrow">MONDAY, JUNE 10, 2024</p>
              <h1>Good morning, {currentUser.name.split(' ')[0]} <span>?</span></h1>
              <p className="hero-copy">Make today a little more curious. There are <b>{skills.length + 3} new skills</b> waiting to be discovered.</p>
            </div>
            <button className="primary-button" onClick={() => { setActiveNav('Discover'); document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' }) }}>Find a skill <span>?</span></button>
          </section>}

          {activeNav === 'Overview' && <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon mint">?</div>
              <div><span>Exchanges completed</span><strong>{currentUser.stats?.exchangesCompleted ?? 24}</strong><small className="positive">? 18% <em>vs last month</em></small></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon lavender">?</div>
              <div><span>Skills learned</span><strong>{currentUser.stats?.skillsLearned ?? 8}</strong><small className="positive">? 2 <em>this month</em></small></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon peach">?</div>
              <div><span>Community impact</span><strong>{currentUser.stats?.communityHours ?? 36}h</strong><small className="neutral">hours shared</small></div>
            </div>
          </section>}

          <div className="content-grid">
            <div className="primary-column">
              {(activeNav === 'Overview' || activeNav === 'Discover') && <section className="section-block" id="discover">
                <div className="section-heading">
                  <div>
                    <h2>Discover skills</h2>
                    <p>People in your community are ready to share.</p>
                  </div>
                  <button className="text-button" onClick={() => setShowAll((value) => !value)}>{showAll ? 'Show less' : 'View all'} <span>?</span></button>
                </div>

                <div className="search-row">
                  <div className="search-box"><span>?</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search for a skill, topic, or person..." /></div>
                  <button className="filter-button">? <span>Filters</span></button>
                </div>

                <div className="skill-grid">
                  {filteredSkills.slice(0, showAll ? filteredSkills.length : 4).map((skill) => (
                    <article className="skill-card" key={skill.id}>
                      <div className="skill-top">
                        <span className="category-pill">{skill.category}</span>
                        <button className="bookmark" aria-label="Save skill">?</button>
                      </div>
                      <h3>{skill.name}</h3>
                      <p className="skill-level">{skill.level} <span>?</span> {skill.availability}</p>
                      <div className="skill-person">
                        <Avatar initials={skill.initials} accent={skill.accent} />
                        <div>
                          <strong>{skill.user}</strong>
                          <small>Offers <b>{skill.offered}</b></small>
                        </div>
                      </div>
                      <div className="skill-footer">
                        <span>? <b>{skill.rating}</b> ({skill.reviews})</span>
                        <button className="request-button" onClick={() => requestExchange(skill)}>Request exchange</button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>}

              {(activeNav === 'Overview' || activeNav === 'Discover') && <section className="section-block form-panel">
                <div className="section-heading">
                  <div>
                    <h2>Add a skill</h2>
                    <p>Share what you can teach or learn.</p>
                  </div>
                </div>

                <form className="stack-form" onSubmit={handleAddSkill}>
                  <div className="inline-fields">
                    <label>
                      Skill name
                      <input value={skillForm.name} onChange={(event) => setSkillForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="e.g. JavaScript" />
                    </label>
                    <label>
                      Category
                      <select value={skillForm.category} onChange={(event) => setSkillForm((prev) => ({ ...prev, category: event.target.value }))}>
                        <option>Technology</option>
                        <option>Creative</option>
                        <option>Business</option>
                        <option>Languages</option>
                      </select>
                    </label>
                  </div>

                  <div className="inline-fields">
                    <label>
                      Level
                      <select value={skillForm.level} onChange={(event) => setSkillForm((prev) => ({ ...prev, level: event.target.value }))}>
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                        <option>Native</option>
                      </select>
                    </label>
                    <label>
                      Type
                      <select value={skillForm.type} onChange={(event) => setSkillForm((prev) => ({ ...prev, type: event.target.value as 'offered' | 'wanted' }))}>
                        <option value="offered">I can teach this</option>
                        <option value="wanted">I want to learn this</option>
                      </select>
                    </label>
                  </div>

                  <button type="submit" className="primary-button">Save skill</button>
                </form>
              </section>}

              {(activeNav === 'Overview' || activeNav === 'My exchanges') && <section className="section-block requests-panel">
                <div className="section-heading">
                  <div>
                    <h2>My exchange requests</h2>
                    <p>Track your current requests and activity.</p>
                  </div>
                </div>

                <div className="request-list">
                  {requests.length === 0 ? (
                    <div className="empty-state">No exchange requests yet. Start by discovering skills and sending a request.</div>
                  ) : (
                    requests.map((request) => {
                      const isIncomingRequest = request.toUserId === currentUser.id

                      return (
                        <div className="request-item" key={request.id}>
                          <div className="request-copy">
                            <strong>{request.fromUser} → {request.toUser}</strong>
                            <p>{request.message}</p>
                          </div>

                          <div className="request-meta">
                            <span className={`request-status ${request.status}`}>{request.status}</span>

                            {isIncomingRequest && request.status === 'pending' && (
                              <div className="request-actions">
                                <button className="accept-button" onClick={() => handleRequestDecision(request.id, 'accepted')}>Accept</button>
                                <button className="decline-button" onClick={() => handleRequestDecision(request.id, 'declined')}>Decline</button>
                              </div>
                            )}

                            {request.status === 'accepted' && (
                              <button className="request-button" onClick={() => scheduleSession(request)}>Book session</button>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </section>}

              {(activeNav === 'Overview' || activeNav === 'Messages') && <section className="section-block messages-panel">
                <div className="section-heading">
                  <div>
                    <h2>Messages</h2>
                    <p>Stay in touch with your learning partners.</p>
                  </div>
                </div>

                <div className="messages-shell">
                  <div className="conversation-list">
                    {chatContacts.length === 0 ? (
                      <div className="empty-state">No conversations yet. Accept a request to start chatting.</div>
                    ) : (
                      chatContacts.map((contact) => (
                        <button
                          key={contact.id}
                          type="button"
                          className={`conversation-item ${selectedChatContact?.id === contact.id ? 'active' : ''}`}
                          onClick={() => setChatPeerId(contact.id)}
                        >
                          <Avatar initials={contact.initials} accent={contact.accent} />
                          <div>
                            <strong>{contact.name}</strong>
                            <small>{contact.id === chatPeerId ? 'Active now' : 'Available to chat'}</small>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  {selectedChatContact && (
                    <div className="chat-panel">
                      <div className="chat-header">
                        <div className="chat-person">
                          <Avatar initials={selectedChatContact.initials} accent={selectedChatContact.accent} />
                          <div>
                            <strong>{selectedChatContact.name}</strong>
                            <small>Skill exchange</small>
                          </div>
                        </div>
                        <button type="button" className="text-button">View profile</button>
                      </div>

                      <div className="chat-thread">
                        {messages.length === 0 ? (
                          <div className="empty-state chat-empty">Start the conversation and share a quick update.</div>
                        ) : (
                          messages.map((message) => (
                            <div key={message.id} className={`message-row ${message.fromUserId === currentUser.id ? 'mine' : ''}`}>
                              <div className="message-bubble">
                                {message.content}
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <form className="chat-composer" onSubmit={handleSendMessage}>
                        <input
                          value={chatDraft}
                          onChange={(event) => setChatDraft(event.target.value)}
                          placeholder="Write a message..."
                        />
                        <button type="submit" className="primary-button">Send</button>
                      </form>
                    </div>
                  )}
                </div>
              </section>}

              {activeNav === 'Calendar' && <section className="section-block calendar-panel">
                <div className="section-heading">
                  <div>
                    <h2>Calendar</h2>
                    <p>Keep your upcoming learning sessions organized.</p>
                  </div>
                  <button className="primary-button" onClick={() => setToast('Choose an accepted exchange to book a session')}>Book session</button>
                </div>
                <div className="calendar-list">
                  {sessions.length === 0 ? (
                    <div className="empty-state">No sessions scheduled yet.</div>
                  ) : (
                    sessions.map((session) => (
                      <article className="calendar-card" key={session.id}>
                        <span className="session-badge" style={{ background: session.color }}>{session.title[0]}</span>
                        <div>
                          <h3>{session.title}</h3>
                          <p>With {session.with}</p>
                          <small>{session.date} at {session.time} · {session.mode}</small>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>}
            </div>

            {activeNav === 'Overview' && <aside className="right-column">
              <section className="side-card profile-card">
                <div className="side-title">
                  <h2>Profile</h2>
                  <button>???</button>
                </div>
                <div className="profile-header">
                  <Avatar initials={currentUser.initials} accent={currentUser.accent} size="large" />
                  <div>
                    <strong>{currentUser.name}</strong>
                    <small>{currentUser.location}</small>
                  </div>
                </div>
                <p className="profile-bio">{currentUser.bio}</p>
                <div className="profile-meta"><span>Availability</span><strong>{currentUser.availability}</strong></div>
                <div className="profile-meta"><span>Skills offered</span><strong>{currentUser.skillsOffered.join(', ') || 'Add your first skill'}</strong></div>
                <div className="profile-meta"><span>Skills wanted</span><strong>{currentUser.skillsWanted.join(', ') || 'Tell us what you want to learn'}</strong></div>
              </section>

              <section className="side-card activity-card">
                <div className="side-title"><h2>Upcoming sessions</h2><button className="text-button">See all</button></div>
                <div className="session-list">
                  {sessions.slice(0, 3).map((session) => (
                    <div className="session-item" key={session.id}>
                      <span className="session-badge" style={{ background: session.color }}>{session.title[0]}</span>
                      <div>
                        <strong>{session.title}</strong>
                        <small>{session.with}</small>
                        <p>{session.date} • {session.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="side-card activity-card">
                <div className="side-title"><h2>Recent activity</h2><button className="text-button">See all</button></div>
                <div className="activity-list">
                  <div className="activity-item"><span className="activity-dot green">?</span><div><p><b>Alex Morgan</b> accepted your exchange request.</p><small>2 hours ago</small></div></div>
                  <div className="activity-item"><span className="activity-dot blue">?</span><div><p>You earned the <b>Curious mind</b> badge.</p><small>Yesterday</small></div></div>
                  <div className="activity-item"><span className="activity-dot peach">?</span><div><p><b>Sofia Reyes</b> saved your profile.</p><small>Yesterday</small></div></div>
                </div>
              </section>

              <section className="side-card prompt-card"><span className="prompt-spark">?</span><h2>What can you teach?</h2><p>Sharing your skills helps the whole community grow.</p><button className="outline-button">Add a skill <span>+</span></button></section>
            </aside>}
          </div>
        </div>
      </main>

      {toast && <div className="toast"><span>?</span>{toast}</div>}
    </div>
  )
}

export default App
