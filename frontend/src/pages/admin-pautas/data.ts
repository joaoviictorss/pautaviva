import type { FilterChip } from '@/components/filter-chips/data'
import type { PollStatus } from '@/lib/poll/status'
import type { Category, Poll } from '@/lib/poll/types'

export type { Category, Poll }

export type StatusFilter = 'ALL' | PollStatus

export interface AdminPautasProps {}

export interface AdminPautasLayoutProps extends AdminPautasProps {
  filters: FilterChip<StatusFilter>[]
  statusFilter: StatusFilter
  onStatusFilterChange: (value: StatusFilter) => void
  polls: Poll[]
  onEdit: (poll: Poll) => void
  loading: boolean
  error?: string
  onNew: () => void
  drawer: { open: boolean; poll?: Poll; categories: Category[] }
  onDrawerOpenChange: (open: boolean) => void
  onSaved: () => void
}
