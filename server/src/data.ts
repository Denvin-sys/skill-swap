export type Skill = {
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

export type ExchangeRequest = {
  id: string
  skillId: string
  toUser: string
  status: 'pending' | 'accepted'
  createdAt: string
}

export const skills: Skill[] = [
  { id: 's1', name: 'Product photography', category: 'Creative', level: 'Intermediate', rating: 4.9, reviews: 18, user: 'Maya Chen', initials: 'MC', accent: '#f2b880', availability: 'This week', offered: 'Brand strategy' },
  { id: 's2', name: 'React & TypeScript', category: 'Technology', level: 'Advanced', rating: 5, reviews: 24, user: 'Alex Morgan', initials: 'AM', accent: '#91b9cc', availability: 'Weekends', offered: 'UX research' },
  { id: 's3', name: 'Conversational Spanish', category: 'Languages', level: 'Native', rating: 4.8, reviews: 32, user: 'Sofia Reyes', initials: 'SR', accent: '#c8b4d9', availability: 'Evenings', offered: 'Illustration' },
  { id: 's4', name: 'Financial planning', category: 'Business', level: 'Advanced', rating: 4.9, reviews: 11, user: 'Jordan Lee', initials: 'JL', accent: '#98c2a8', availability: 'Mornings', offered: 'Public speaking' },
]

export const sessions = [
  { id: 'session-1', title: 'Portfolio review', with: 'Alex Morgan', date: 'Today', time: '4:00 PM', mode: 'Video call', color: '#91b9cc' },
  { id: 'session-2', title: 'Spanish conversation', with: 'Sofia Reyes', date: 'Tomorrow', time: '6:30 PM', mode: 'Video call', color: '#c8b4d9' },
  { id: 'session-3', title: 'Brand strategy basics', with: 'Maya Chen', date: 'Fri, Jun 14', time: '11:00 AM', mode: 'Video call', color: '#f2b880' },
]

export const requests: ExchangeRequest[] = []
