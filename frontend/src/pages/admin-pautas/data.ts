import type { FilterChip } from '@/components/filter-chips/data'
import type { CategoryLook } from '@/lib/poll/categories'
import type { PollStatus } from '@/lib/poll/status'
import type { Category, Poll } from '@/lib/poll/types'

export type StatusFilter = 'ALL' | PollStatus

export interface PollCardView {
  id: string
  title: string
  description: string
  categoryName: string
  categoryLook: CategoryLook
  statusLabel: string
  statusClassName: string
  bar?: { segments: { key: string; color: string; percent: number }[]; label: string; forLabel: string }
  participationsLabel?: string
  scheduleLabel?: string
  timeLabel?: string
  onEdit?: () => void
}

export interface AdminPautasProps {}

export interface AdminPautasLayoutProps extends AdminPautasProps {
  filters: FilterChip<StatusFilter>[]
  statusFilter: StatusFilter
  onStatusFilterChange: (value: StatusFilter) => void
  cards: PollCardView[]
  loading: boolean
  error?: string
  onNew: () => void
  drawer: { open: boolean; poll?: Poll; categories: Category[] }
  onDrawerOpenChange: (open: boolean) => void
  onSaved: () => void
}
