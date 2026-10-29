import type { PollStatus } from './status'

export interface Category {
  id: string
  name: string
}

export interface Poll {
  id: string
  title: string
  description: string
  startsAt: string
  endsAt: string
  status: PollStatus
  category: Category
  participations: number
  results: { FOR: number; AGAINST: number; ABSTAIN: number }
}

export interface PollPage {
  items: Poll[]
  total: number
  page: number
  pageSize: number
}
