import type { RejectCommentDialogProps } from '@/components/reject-comment-dialog/data'

export interface ModerationComment {
  id: string
  text: string
  createdAt: string
  status: 'PENDING' | 'APPROVED'
  classification: 'ADEQUATE' | 'SUSPECT' | 'INAPPROPRIATE' | null
  moderationReason: string | null
  reports: { reason: 'OFFENSIVE_CONTENT' | 'SPAM' | 'HATE_SPEECH' | 'OTHER'; createdAt: string }[]
  author: { name: string; image: string | null }
  poll: { id: string; title: string }
}

export interface ModerationDecision {
  id: string
  text: string
  updatedAt: string
  status: 'APPROVED' | 'REJECTED' | 'REMOVED'
  moderationReason: string | null
  author: { name: string; image: string | null }
  moderatedBy: { name: string }
  poll: { id: string; title: string }
}

export type ModerationAction = 'APPROVE' | 'REJECT' | 'REMOVE' | 'DISMISS_REPORT' | 'UNDO'

export type ModeracaoTab = 'PENDING' | 'REPORTED' | 'HISTORY'

export interface ModeracaoTabOption {
  value: ModeracaoTab
  label: string
  count: number
}

export interface ModeracaoPollOption {
  value: string
  label: string
}

export interface ModeracaoItem {
  id: string
  author: string
  avatar: string
  initials: string
  pollId: string
  pollTitle: string
  age: string
  overdue: boolean
  text: string
  badge?: string
  flag?: string
  note?: string
  selected: boolean
  processing: boolean
  keepLabel: string
  discardLabel: string
  decision?: { label: string; approved: boolean; meta: string }
  undoable: boolean
}

export interface ModeracaoProps {}

export interface ModeracaoLayoutProps extends ModeracaoProps {
  tabs: ModeracaoTabOption[]
  tab: ModeracaoTab
  onTabChange: (tab: ModeracaoTab) => void
  pollOptions: ModeracaoPollOption[]
  pollFilter: string
  onPollFilterChange: (pollId: string) => void
  items: ModeracaoItem[]
  loading: boolean
  error?: string
  allSelected: boolean
  selectedCount: number
  bulkLabel: string
  onToggleAll: () => void
  onToggleItem: (id: string) => void
  onKeep: (ids: string[]) => void
  onDiscard: (ids: string[]) => void
  onUndo: (id: string) => void
  rejectDialog: RejectCommentDialogProps
}
