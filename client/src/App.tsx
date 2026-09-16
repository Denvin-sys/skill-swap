import { useEffect, useMemo, useState } from 'react'

type Skill = {
  id: string
  name: string
  category: string
  level: string
  rating: number
  reviews: number
  user: string
  initials: string
  accent: string
  availability: string
  offered: string
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

const fallbackSkills: Skill[] = [
  { id: 's1', name: 'Product photography', category: 'Creative', level: 'Intermediate', rating: 4.9, reviews: 18, user: 'Maya Chen', initials: 'MC', accent: '#f2b880', availability: 'This week', offered: 'Brand strategy' },
  { id: 's2', name: 'React & TypeScript', category: 'Technology', level: 'Advanced', rating: 5, reviews: 24, user: 'Alex Morgan', initials: 'AM', accent: '#91b9cc', availability: 'Weekends', offered: 'UX research' },
  { id: 's3', name: 'Conversational Spanish', category: 'Languages', level: 'Native', rating: 4.8, reviews: 32, user: 'Sofia Reyes', initials: 'SR', accent: '#c8b4d9', availability: 'Evenings', offered: 'Illustration' },
  { id: 's4', name: 'Financial planning', category: 'Business', level: 'Advanced', rating: 4.9, reviews: 11, user: 'Jordan Lee', initials: 'JL', accent: '#98c2a8', availability: 'Mornings', offered: 'Public speaking' },
]

const fallbackSessions: Session[] = [
  { id: 'session-1', title: 'Portfolio review', with: 'Alex Morgan', date: 'Today', time: '4:00 PM', mode: 'Video call', color: '#91b9cc' },
  { id: 'session-2', title: 'Spanish conversation', with: 'Sofia Reyes', date: 'Tomorrow', time: '6:30 PM', mode: 'Video call', color: '#c8b4d9' },
  { id: 'session-3', title: 'Brand strategy basics', with: 'Maya Chen', date: 'Fri, Jun 14', time: '11:00 AM', mode: 'Video call', color: '#f2b880' },
]

const navItems = [
  ['Overview', '⌂'],
  ['Discover', '✦'],
  ['My exchanges', '↔'],
  ['Messages', '▱'],
  ['Calendar', '□'],
]

async function getJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(path)
    if (!response.ok) throw new Error('API unavailable')
    return await response.json() as T
  } catch {
    return fallback
  }
}

function Avatar({ initials, accent, size = 'normal' }: { initials: string; accent: string; size?: 'normal' | 'large' }) {
  return <span className={`avatar ${size}`} style={{ background: accent }}>{initials}</span>
}

function App() {
  const [activeNav, setActiveNav] = useState('Overview')
  const [skills, setSkills] = useState<Skill[]>(fallbackSkills)
  const [sessions, setSessions] = useState<Session[]>(fallbackSessions)
  const [requested, setRequested] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState('')
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    getJson<Skill[]>('/api/skills', fallbackSkills).then(setSkills)
    getJson<Session[]>('/api/sessions', fallbackSessions).then(setSessions)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  const filteredSkills = useMemo(() => skills.filter((skill) =>
    `${skill.name} ${skill.category} ${skill.user}`.toLowerCase().includes(query.toLowerCase()),
  ), [skills, query])

  function requestExchange(skill: Skill) {
    if (requested.includes(skill.id)) return
    setRequested((current) => [...current, skill.id])
    setToast(`Request sent to ${skill.user}`)
    fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId: skill.id, toUser: skill.user }),
    }).catch(() => undefined)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">↗</span><span>skill<span>swap</span></span></div>
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
          <button className="nav-item"><span className="nav-icon">⚙</span>Settings</button>
          <div className="profile-mini"><Avatar initials="YJ" accent="#e7c1a9" /><div><strong>Yuna James</strong><small>View profile</small></div><span className="more">•••</span></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><b>/</b><strong>{activeNav}</strong></div>
          <div className="top-actions"><button className="icon-button" aria-label="Notifications">♧<i /></button><div className="top-avatar">YJ</div></div>
        </header>

        <div className="page">
          <section className="hero">
            <div><p className="eyebrow">MONDAY, JUNE 10, 2024</p><h1>Good morning, Yuna <span>✦</span></h1><p className="hero-copy">Make today a little more curious. There are <b>12 new skills</b> waiting to be discovered.</p></div>
            <button className="primary-button" onClick={() => { setActiveNav('Discover'); document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' }) }}>Find a skill <span>→</span></button>
          </section>

          <section className="stats-grid">
            <div className="stat-card"><div className="stat-icon mint">↔</div><div><span>Exchanges completed</span><strong>24</strong><small className="positive">↑ 18% <em>vs last month</em></small></div></div>
            <div className="stat-card"><div className="stat-icon lavender">✦</div><div><span>Skills learned</span><strong>8</strong><small className="positive">↑ 2 <em>this month</em></small></div></div>
            <div className="stat-card"><div className="stat-icon peach">♧</div><div><span>Community impact</span><strong>36h</strong><small className="neutral">hours shared</small></div></div>
          </section>

          <div className="content-grid">
            <div className="primary-column">
              <section className="section-block" id="discover">
                <div className="section-heading"><div><h2>Discover skills</h2><p>People in your community are ready to share.</p></div><button className="text-button" onClick={() => setShowAll(!showAll)}>{showAll ? 'Show less' : 'View all'} <span>→</span></button></div>
                <div className="search-row"><div className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search for a skill, topic, or person..." /></div><button className="filter-button">☷ <span>Filters</span></button></div>
                <div className="skill-grid">
                  {filteredSkills.slice(0, showAll ? filteredSkills.length : 4).map((skill) => <article className="skill-card" key={skill.id}>
                    <div className="skill-top"><span className="category-pill">{skill.category}</span><button className="bookmark" aria-label="Save skill">♡</button></div>
                    <h3>{skill.name}</h3><p className="skill-level">{skill.level} <span>•</span> {skill.availability}</p>
                    <div className="skill-person"><Avatar initials={skill.initials} accent={skill.accent} /><div><strong>{skill.user}</strong><small>Offers <b>{skill.offered}</b></small></div></div>
                    <div className="skill-footer"><span>★ <b>{skill.rating}</b> ({skill.reviews})</span><button className={`request-button ${requested.includes(skill.id) ? 'sent' : ''}`} onClick={() => requestExchange(skill)}>{requested.includes(skill.id) ? 'Requested ✓' : 'Request exchange'}</button></div>
                  </article>)}
                </div>
                {filteredSkills.length === 0 && <div className="empty-state">No skills found. Try a different search.</div>}
              </section>

              <section className="section-block sessions-block">
                <div className="section-heading"><div><h2>Upcoming sessions</h2><p>Keep your momentum going.</p></div><button className="text-button">View calendar <span>→</span></button></div>
                <div className="session-list">{sessions.slice(0, 3).map((session) => <div className="session-row" key={session.id}><div className="date-block"><strong>{session.date.split(',')[0]}</strong><small>{session.date.includes(',') ? session.date.split(',')[1] : 'JUN 10'}</small></div><div className="session-avatar"><Avatar initials={session.with.split(' ').map((name) => name[0]).join('')} accent={session.color} /></div><div className="session-info"><strong>{session.title}</strong><span>with {session.with}</span></div><div className="session-time"><strong>{session.time}</strong><span>{session.mode}</span></div><button className="more-button">•••</button></div>)}</div>
              </section>
            </div>

            <aside className="right-column">
              <section className="side-card progress-card"><div className="side-title"><h2>Your learning journey</h2><button>•••</button></div><div className="progress-wrap"><div className="progress-ring"><span>68<small>%</small></span></div><div><strong>On a roll!</strong><p>You're 2 exchanges away from your next milestone.</p></div></div><div className="progress-track"><span /></div><div className="progress-meta"><span>Current streak <b>6 days</b></span><span>Goal <b>10 exchanges</b></span></div></section>
              <section className="side-card activity-card"><div className="side-title"><h2>Recent activity</h2><button className="text-button">See all</button></div><div className="activity-list"><div className="activity-item"><span className="activity-dot green">✓</span><div><p><b>Alex Morgan</b> accepted your exchange request.</p><small>2 hours ago</small></div></div><div className="activity-item"><span className="activity-dot blue">✦</span><div><p>You earned the <b>Curious mind</b> badge.</p><small>Yesterday</small></div></div><div className="activity-item"><span className="activity-dot peach">♡</span><div><p><b>Sofia Reyes</b> saved your profile.</p><small>Yesterday</small></div></div></div></section>
              <section className="side-card prompt-card"><span className="prompt-spark">✦</span><h2>What can you teach?</h2><p>Sharing your skills helps the whole community grow.</p><button className="outline-button">Add a skill <span>+</span></button></section>
            </aside>
          </div>
        </div>
      </main>
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </div>
  )
}

export default App
