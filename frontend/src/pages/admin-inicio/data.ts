import type { LucideIcon } from 'lucide-react'

import type { RejectCommentDialogProps } from '@/components/reject-comment-dialog/data'
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

export interface AdminInicioKpi {
  label: string
  value: string
  icon: LucideIcon
  delta: string
  deltaTone: 'up' | 'down' | 'neutral' | 'warning'
  note: string
  to?: '/admin/moderacao'
}

export interface AdminInicioDayPoint {
  label: string
  count: number
}

export interface AdminInicioCategory {
  name: string
  value: string
  percent: number
  icon: LucideIcon
  color: string
}

export interface AdminInicioClosingPoll {
  id: string
  title: string
  timeLabel: string
  urgent: boolean
  bar: { segments: { key: string; color: string; percent: number }[]; label: string }
  participationsLabel: string
}

export interface AdminInicioUpcomingPoll {
  id: string
  title: string
  day: string
  month: string
  detail: string
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
  kpis: AdminInicioKpi[]
  days: AdminInicioDayPoint[]
  peakLabel?: string
  categories: AdminInicioCategory[]
  closing: AdminInicioClosingPoll[]
  upcoming: AdminInicioUpcomingPoll[]
  /** Ausente para o gestor: a fila de moderação não é dele. */
  moderation?: AdminInicioModeration
}
