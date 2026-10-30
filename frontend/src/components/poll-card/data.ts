import type { CategoryLook } from '@/lib/poll/categories'
import type { Poll } from '@/lib/poll/types'

export interface PollCardProps {
  poll: Poll
  /** Mostra o botão "Editar" (só aparece em pautas agendadas). */
  onEdit?: (poll: Poll) => void
  showDetails?: boolean
}

export interface PollCardLayoutProps extends PollCardProps {
  categoryLook: CategoryLook
  statusLabel: string
  statusClassName: string
  bar?: { segments: { key: string; color: string; percent: number }[]; label: string }
  participationsLabel?: string
  scheduleLabel?: string
  timeLabel?: string
  onEditClick?: () => void
}
