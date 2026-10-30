import type { CategoryBar } from '@/lib/poll/categories'

import type { Kpi } from '@/components/kpi-card'
import type { RejectCommentDialogProps } from '@/components/reject-comment-dialog/data'
import type { ClosingPollRow, UpcomingPollRow } from '@/lib/poll/rows'
import type { Poll } from '@/lib/poll/types'

export interface AdminDashboardTotal {
  current: number
  previous: number
}

export interface AdminDashboard {
  openPolls: AdminDashboardTotal
  participations: AdminDashboardTotal
  citizens: AdminDashboardTotal
  moderation: { pending: number; overdue: number }
  participationsByDay: { day: string; count: number }[]
  participationsByCategory: { name: string; count: number }[]
  endingSoon: Poll[]
  upcoming: { id: string; title: string; startsAt: string; endsAt: string; category: { name: string } }[]
}

export type AdminInicioPeriod = 7 | 30 | 90

export interface AdminInicioDayPoint {
  label: string
  count: number
}

export interface AdminInicioModerationItem {
  id: string
  author: string
  avatar: string
  initials: string
  poll: string
  age: string
  overdue: boolean
  text: string
  flag?: string
  keepLabel: string
  discardLabel: string
  processing: boolean
}

export interface AdminInicioModeration {
  count: string
  items: AdminInicioModerationItem[]
  more: number
  onKeep: (id: string) => void
  onDiscard: (id: string) => void
  rejectDialog: RejectCommentDialogProps
}

export interface AdminInicioProps {}

export interface AdminInicioLayoutProps extends AdminInicioProps {
  firstName: string
  loading: boolean
  error?: string
  periods: AdminInicioPeriod[]
  period: AdminInicioPeriod
  onPeriodChange: (period: AdminInicioPeriod) => void
  kpis: Kpi[]
  days: AdminInicioDayPoint[]
  peakLabel?: string
  categories: CategoryBar[]
  closing: ClosingPollRow[]
  upcoming: UpcomingPollRow[]
  /** Ausente para o gestor: a fila de moderação não é dele. */
  moderation?: AdminInicioModeration
}
