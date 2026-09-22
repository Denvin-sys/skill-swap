export type User = {
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
  passwordHash: string
}

export type Skill = {
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

export type ExchangeRequest = {
  id: string
  skillId: string
  skillName: string
  fromUserId: string
  toUserId: string
  toUser: string
  fromUser: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
  message: string
}

export type Message = {
  id: string
  fromUserId: string
  toUserId: string
  content: string
  createdAt: string
}

export type Session = {
  id: string
  title: string
  with: string
  date: string
  time: string
  mode: string
  color: string
}

export const users: User[] = [
  {
    id: 'u1',
    name: 'Yuna James',
    email: 'yuna@skillswap.dev',
    bio: 'Curious maker and lifelong learner.',
    initials: 'YJ',
    accent: '#e7c1a9',
    location: 'Bengaluru',
    availability: 'Evenings',
    skillsOffered: ['Brand strategy', 'Content writing'],
    skillsWanted: ['Product photography', 'Spanish'],
    passwordHash: '$2b$10$UMODNp58yimkXcm2B4oc7u/CWbvN3IMLZ/rigC8ZXcIQkmrMCWqMK',
  },
  {
    id: 'u2',
    name: 'Alex Morgan',
    email: 'alex@skillswap.dev',
    bio: 'Frontend engineer who loves teaching React.',
    initials: 'AM',
    accent: '#91b9cc',
    location: 'San Francisco',
    availability: 'Weekends',
    skillsOffered: ['React & TypeScript', 'UX research'],
    skillsWanted: ['Public speaking'],
    passwordHash: '$2b$10$xvLxU4enP4kCleUXK//zwej1Tfmap4YGMKBXb/a7Zc/r8r0rOw7Ja',
  },
  {
    id: 'u3',
    name: 'Maya Chen',
    email: 'maya@skillswap.dev',
    bio: 'Creative storyteller and product photographer.',
    initials: 'MC',
    accent: '#f2b880',
    location: 'Singapore',
    availability: 'This week',
    skillsOffered: ['Product photography', 'Brand strategy'],
    skillsWanted: ['Financial planning'],
    passwordHash: '$2b$10$aXCeScig8LbL39lhek23fuMulMh0zmucpPfeoT2RWn8lSIU/QZU9G',
  },
  {
    id: 'u4',
    name: 'Sofia Reyes',
    email: 'sofia@skillswap.dev',
    bio: 'Spanish tutor and illustrator.',
    initials: 'SR',
    accent: '#c8b4d9',
    location: 'Madrid',
    availability: 'Evenings',
    skillsOffered: ['Conversational Spanish', 'Illustration'],
    skillsWanted: ['Product strategy'],
    passwordHash: '$2b$10$SkAG1SAG2UOqGx9/uyDG/O3eY1LkJg1Y2cmbZGbheoH4SE4A7LO8i',
  },
]

export const skills: Skill[] = [
  { id: 's1', name: 'Product photography', category: 'Creative', level: 'Intermediate', rating: 4.9, reviews: 18, userId: 'u3', user: 'Maya Chen', initials: 'MC', accent: '#f2b880', availability: 'This week', offered: 'Brand strategy', type: 'offered' },
  { id: 's2', name: 'React & TypeScript', category: 'Technology', level: 'Advanced', rating: 5, reviews: 24, userId: 'u2', user: 'Alex Morgan', initials: 'AM', accent: '#91b9cc', availability: 'Weekends', offered: 'UX research', type: 'offered' },
  { id: 's3', name: 'Conversational Spanish', category: 'Languages', level: 'Native', rating: 4.8, reviews: 32, userId: 'u4', user: 'Sofia Reyes', initials: 'SR', accent: '#c8b4d9', availability: 'Evenings', offered: 'Illustration', type: 'offered' },
  { id: 's4', name: 'Financial planning', category: 'Business', level: 'Advanced', rating: 4.9, reviews: 11, userId: 'u1', user: 'Yuna James', initials: 'YJ', accent: '#e7c1a9', availability: 'Mornings', offered: 'Content writing', type: 'offered' },
  { id: 's5', name: 'Brand strategy', category: 'Business', level: 'Intermediate', rating: 4.7, reviews: 14, userId: 'u1', user: 'Yuna James', initials: 'YJ', accent: '#e7c1a9', availability: 'Mornings', offered: 'Product photography', type: 'wanted' },
  { id: 's6', name: 'Spanish', category: 'Languages', level: 'Beginner', rating: 4.6, reviews: 9, userId: 'u1', user: 'Yuna James', initials: 'YJ', accent: '#e7c1a9', availability: 'Evenings', offered: 'React tutoring', type: 'wanted' },
]

export const sessions: Session[] = [
  { id: 'session-1', title: 'Portfolio review', with: 'Alex Morgan', date: 'Today', time: '4:00 PM', mode: 'Video call', color: '#91b9cc' },
  { id: 'session-2', title: 'Spanish conversation', with: 'Sofia Reyes', date: 'Tomorrow', time: '6:30 PM', mode: 'Video call', color: '#c8b4d9' },
  { id: 'session-3', title: 'Brand strategy basics', with: 'Maya Chen', date: 'Fri, Jun 14', time: '11:00 AM', mode: 'Video call', color: '#f2b880' },
]

export const requests: ExchangeRequest[] = []

export const messages: Message[] = [
  {
    id: 'msg-1',
    fromUserId: 'u2',
    toUserId: 'u1',
    content: 'Thanks for the quick intro! I can review your portfolio this Friday.',
    createdAt: '2024-06-10T09:10:00.000Z',
  },
  {
    id: 'msg-2',
    fromUserId: 'u1',
    toUserId: 'u2',
    content: 'Perfect, I would love that. Let’s do a 30-minute session after lunch.',
    createdAt: '2024-06-10T09:15:00.000Z',
  },
  {
    id: 'msg-3',
    fromUserId: 'u4',
    toUserId: 'u1',
    content: 'I can help with conversational Spanish this week. Want to book a practice call?',
    createdAt: '2024-06-10T12:00:00.000Z',
  },
]
