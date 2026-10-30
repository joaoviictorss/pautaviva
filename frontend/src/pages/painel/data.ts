import type { Kpi } from '@/components/kpi-card'
import type { CategoryBar, CategoryLook } from '@/lib/poll/categories'
import type { Poll, VoteOption } from '@/lib/poll/types'

export interface PainelProps {}

export interface PendingPoll {
  poll: Poll
  categoryLook: CategoryLook
  timeLabel: string
}

export interface CommentRow {
  id: string
  pollId: string
  pollTitle: string
  text: string
  statusLabel: string
  statusClassName: string
}

export interface PainelLayoutProps extends PainelProps {
  firstName: string
  kpis: Kpi[]
  pendingTotal: number
  pending: PendingPoll[]
  comments: CommentRow[]
  months: { label: string; count: number }[]
  categories: CategoryBar[]
  results: Poll[]
  voting?: { poll: Poll; option: VoteOption }
  loading: boolean
  error?: string
  onRetry: () => void
  onVote: (poll: Poll, option: VoteOption) => void
  onCloseVote: () => void
  onVoted: () => void
}
