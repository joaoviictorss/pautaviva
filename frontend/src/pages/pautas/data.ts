import type { FilterChip } from '@/components/filter-chips/data'
import type { PollStatus } from '@/lib/poll/status'
import type { Poll } from '@/lib/poll/types'

/** Decide a ação de cada card: quem vota, quem precisa entrar e quem só consulta. */
export type PautasViewer = 'citizen' | 'visitor' | 'staff'

export interface PautasProps {}

export interface PautasLayoutProps extends PautasProps {
  viewer: PautasViewer
  polls: Poll[]
  statusFilters: FilterChip<PollStatus>[]
  status: PollStatus
  categoryFilters: FilterChip[]
  categoryId: string
  missing: boolean
  showMissing: boolean
  page: number
  pageSize: number
  total: number
  hasActiveFilters: boolean
  voting?: Poll
  loading: boolean
  error?: string
  onCategoryChange: (categoryId: string) => void
  onStatusChange: (status: PollStatus) => void
  onMissingChange: (missing: boolean) => void
  onPageChange: (page: number) => void
  onClearFilters: () => void
  onVote: (poll: Poll) => void
  onCloseVote: () => void
  onVoted: () => void
  onToggleReminder: (poll: Poll) => void
}
