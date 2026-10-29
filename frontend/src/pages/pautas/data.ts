import type { Category, Poll } from '@/lib/poll/types'
import type { PollStatus } from '@/lib/poll/status'

export type PollStatusFilter = 'ALL' | PollStatus
export type PollSort = 'recent' | 'start' | 'ending'

export interface PautasProps {}

export interface PautasUser {
  name: string
  email: string
  image?: string
  initials: string
  roleLabel: string
}

export interface PautasLayoutProps extends PautasProps {
  user?: PautasUser
  userLoading: boolean
  categories: Category[]
  polls: Poll[]
  categoryId: string
  status: PollStatusFilter
  sort: PollSort
  page: number
  pageSize: number
  total: number
  search: string
  loading: boolean
  error?: string
  onCategoryChange: (categoryId: string) => void
  onStatusChange: (status: PollStatusFilter) => void
  onSortChange: (sort: PollSort) => void
  onPageChange: (page: number) => void
  onSearchChange: (search: string) => void
  onClearFilters: () => void
}
