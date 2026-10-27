/** Espelha o enum PollStatus do backend (backend/prisma/schema.prisma). */
export type PollStatus = 'SCHEDULED' | 'OPEN' | 'CLOSED'

export const POLL_STATUS: Record<PollStatus, { label: string; className: string }> = {
  OPEN: { label: 'Aberta', className: 'bg-accent text-accent-foreground' },
  SCHEDULED: { label: 'Agendada', className: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  CLOSED: { label: 'Encerrada', className: 'bg-muted text-muted-foreground' },
}
