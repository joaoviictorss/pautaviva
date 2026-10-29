import type { PollStatus } from './status'

/** Espelha o enum VoteOption do backend (backend/prisma/schema.prisma). */
export type VoteOption = 'FOR' | 'AGAINST' | 'ABSTAIN'

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
  results: Record<VoteOption, number>
}

export interface PollPage {
  items: Poll[]
  total: number
  page: number
  pageSize: number
}

export interface PollDetail extends Poll {
  hasVoted: boolean
}
