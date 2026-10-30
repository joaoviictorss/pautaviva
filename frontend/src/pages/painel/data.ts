import type { CategoryLook } from '@/lib/poll/categories'
import type { Poll } from '@/lib/poll/types'

export interface PainelProps {}

export interface PainelPoll {
  poll: Poll
  statusLabel: string
  statusClassName: string
  categoryLook: CategoryLook
  dateLabel: string
}

export interface ParticipationItem extends PainelPoll {
  participatedAtLabel: string
  resultsAvailable: boolean
}

export interface PainelLayoutProps extends PainelProps {
  name: string
  firstName: string
  initials: string
  email: string
  image?: string
  roleLabel: string
  signingOut: boolean
  onSignOut: () => void
  openPolls: PainelPoll[]
  scheduledPolls: PainelPoll[]
  participationCount: number
  resultsAvailableCount: number
  recentParticipations: ParticipationItem[]
  loadingDashboard: boolean
  dashboardError?: string
  onRetry: () => void
}

export interface ParticipationSummary {
  total: number
  resultsAvailable: number
  items: {
    participatedAt: string
    resultsAvailable: boolean
    poll: Poll
  }[]
}
