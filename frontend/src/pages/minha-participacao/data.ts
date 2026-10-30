import type { FilterChip } from '@/components/filter-chips/data'
import type { ParticipationRow } from '@/lib/poll/rows'
import type { ParticipationItem } from '@/lib/poll/types'

export interface MinhaParticipacaoProps {}

export type ParticipationTab = 'votos' | 'comentarios'

export interface CommentItem {
  id: string
  pollId: string
  pollTitle: string
  text: string
  dateLabel: string
  statusLabel: string
  statusClassName: string
  rejectionReason?: string
  canResubmit: boolean
  canDelete: boolean
}

export interface MinhaParticipacaoLayoutProps extends MinhaParticipacaoProps {
  tabs: FilterChip<ParticipationTab>[]
  tab: ParticipationTab
  months: { label: string; items: ParticipationRow[] }[]
  comments: CommentItem[]
  total: number
  page: number
  pageSize: number
  editingId?: string
  editingText: string
  deletingId?: string
  saving: boolean
  downloading: boolean
  loading: boolean
  error?: string
  onTabChange: (tab: ParticipationTab) => void
  onPageChange: (page: number) => void
  onEdit: (comment: CommentItem) => void
  onEditingTextChange: (text: string) => void
  onCancelEdit: () => void
  onResubmit: () => void
  onAskDelete: (id?: string) => void
  onDelete: () => void
  onDownload: () => void
}

export interface ParticipationPage {
  total: number
  resultsAvailable: number
  page: number
  pageSize: number
  items: ParticipationItem[]
}
