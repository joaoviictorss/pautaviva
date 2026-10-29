import type { CategoryLook } from '@/lib/poll/categories'
import type { Poll } from '@/lib/poll/types'

export interface PollCardProps {
  poll: Poll
  /** Mostra o botão "Editar" (só aparece em pautas agendadas). */
  onEdit?: (poll: Poll) => void
  /** O card inteiro vira link para o detalhe da pauta. */
  linked?: boolean
}

export interface PollCardLayoutProps extends PollCardProps {
  categoryLook: CategoryLook
  statusLabel: string
  statusClassName: string
  bar?: { segments: { key: string; color: string; percent: number }[]; label: string; forLabel: string }
  participationsLabel?: string
  scheduleLabel?: string
  timeLabel?: string
  onEditClick?: () => void
}
