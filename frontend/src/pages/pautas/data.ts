import type { FilterChip } from '@/components/filter-chips/data'
import type { PollStatus } from '@/lib/poll/status'
import type { Poll } from '@/lib/poll/types'

export type StatusFilter = 'ALL' | PollStatus

export interface CategoryOption {
  value: string
  label: string
}

export interface PautasProps {}

export interface PautasLayoutProps extends PautasProps {
  filters: FilterChip<StatusFilter>[]
  statusFilter: StatusFilter
  onStatusFilterChange: (value: StatusFilter) => void
  categoryOptions: CategoryOption[]
  categoryFilter: string
  onCategoryFilterChange: (value: string) => void
  polls: Poll[]
  loading: boolean
  error?: string
}
