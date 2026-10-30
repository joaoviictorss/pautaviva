import { differenceInCalendarDays } from 'date-fns'

import type { CommentStatus, Poll } from './types'

/** Espelha o enum PollStatus do backend (backend/prisma/schema.prisma). */
export type PollStatus = 'SCHEDULED' | 'OPEN' | 'CLOSED'

export type PollStatusFilter = 'ALL' | PollStatus

export const POLL_STATUS_FILTERS: { value: PollStatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'OPEN', label: 'Abertas' },
  { value: 'CLOSED', label: 'Encerradas' },
  { value: 'SCHEDULED', label: 'Agendadas' },
]

export const POLL_STATUS: Record<PollStatus, { label: string; className: string }> = {
  OPEN: { label: 'Aberta', className: 'bg-accent text-accent-foreground' },
  SCHEDULED: { label: 'Agendada', className: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  CLOSED: { label: 'Encerrada', className: 'bg-muted text-muted-foreground' },
}

export const COMMENT_STATUS: Record<CommentStatus, { label: string; className: string }> = {
  PENDING: { label: 'Em análise', className: 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
  APPROVED: { label: 'Publicado', className: 'bg-accent text-accent-foreground' },
  REJECTED: { label: 'Não aprovado', className: 'bg-destructive/10 text-destructive' },
  REMOVED: { label: 'Removido', className: 'bg-muted text-muted-foreground' },
}

export function getPollTimeLabel({ status, startsAt, endsAt }: Pick<Poll, 'status' | 'startsAt' | 'endsAt'>) {
  const now = new Date()
  if (status === 'SCHEDULED') {
    const days = differenceInCalendarDays(new Date(startsAt), now)
    return days <= 0 ? 'Abre hoje' : days === 1 ? 'Abre amanhã' : `Abre em ${days} dias`
  }
  const days = differenceInCalendarDays(new Date(endsAt), now)
  if (status === 'OPEN') return days <= 0 ? 'Encerra hoje' : days === 1 ? 'Encerra amanhã' : `Encerra em ${days} dias`
  return days >= 0 ? 'Encerrada hoje' : days === -1 ? 'Encerrada ontem' : `Encerrada há ${-days} dias`
}
