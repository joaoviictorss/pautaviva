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
  /** Só em GET /polls, para quem está logado. */
  hasVoted?: boolean
  hasReminder?: boolean
}

export interface PollPage {
  items: Poll[]
  total: number
  counts: Record<PollStatus, number>
  page: number
  pageSize: number
}

export interface PollDetail extends Poll {
  hasVoted: boolean
  hasReminder: boolean
}

export interface ParticipationItem {
  participatedAt: string
  resultsAvailable: boolean
  poll: Poll
}

export interface CitizenSummary {
  total: number
  pendingTotal: number
  pending: Poll[]
  approved: number
  results: Poll[]
  activity: { participatedAt: string; category: string }[]
}

export type CommentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REMOVED'

export interface MyComment {
  id: string
  text: string
  status: CommentStatus
  createdAt: string
  moderationReason: string | null
  poll: { id: string; title: string; status: PollStatus; endsAt: string }
}

export interface PollStats extends Poll {
  createdAt: string
  createdBy: string
  comments: Record<'PENDING' | 'APPROVED' | 'REJECTED' | 'REMOVED', number>
  pendingReports: number
  participationsByDay: { day: string; count: number }[]
  history: { id: string; action: string; createdAt: string; actorName: string | null }[]
}
