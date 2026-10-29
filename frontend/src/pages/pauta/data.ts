import type { CategoryLook } from '@/lib/poll/categories'
import type { PollDetail } from '@/lib/poll/types'
import type { VoteBar } from '@/lib/poll/votes'

export interface PautaProps {}

export interface PautaLayoutProps extends PautaProps {
  poll?: PollDetail
  loading: boolean
  error?: string
  exportError?: string
  live: boolean
  canExport: boolean
  exportingFormat?: 'csv' | 'pdf'
  categoryLook?: CategoryLook
  statusLabel?: string
  statusClassName?: string
  periodLabel?: string
  participationsLabel?: string
  bars?: VoteBar[]
  onVoted: () => void
  onExport: (format: 'csv' | 'pdf') => void
}
