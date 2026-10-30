import type { RejectCommentDialogProps } from '@/components/reject-comment-dialog/data'
import type { ExportFormat } from '@/hooks/use-poll-export'
import type { CategoryLook } from '@/lib/poll/categories'
import type { PollStats } from '@/lib/poll/types'
import type { VoteBar } from '@/lib/poll/votes'

export interface AdminPautaProps {}

export interface AdminPautaComment {
  id: string
  text: string
  createdAt: string
  author: { name: string; image: string | null }
}

export interface AdminPautaCommentItem {
  id: string
  author: string
  avatar: string
  initials: string
  when: string
  text: string
}

export interface AdminPautaMeta {
  label: string
  value: string
}

export interface AdminPautaDayPoint {
  label: string
  count: number
}

export interface AdminPautaHistoryItem {
  id: string
  label: string
  detail: string
}

export interface AdminPautaLayoutProps extends AdminPautaProps {
  poll?: PollStats
  loading: boolean
  error?: string
  live: boolean
  categoryLook?: CategoryLook
  statusLabel?: string
  statusClassName?: string
  participationsLabel?: string
  resultNote?: string
  emptyResultLabel?: string
  bars?: VoteBar[]
  barLabel?: string
  days: AdminPautaDayPoint[]
  peakLabel?: string
  comments: AdminPautaCommentItem[]
  pendingLabel?: string
  canModerate: boolean
  onRemoveComment: (id: string) => void
  elapsedPercent: number
  startLabel?: string
  endLabel?: string
  timeLabel?: string
  meta: AdminPautaMeta[]
  history: AdminPautaHistoryItem[]
  exportingFormat?: ExportFormat
  exportError?: string
  onExport: (format: ExportFormat) => void
  removeDialog: RejectCommentDialogProps
}
