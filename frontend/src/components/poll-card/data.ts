import type { CategoryLook } from '@/lib/poll/categories'
import type { Poll } from '@/lib/poll/types'

export interface PollCardProps {
  poll: Poll
  /** Mostra o botão "Editar" (só aparece em pautas agendadas). */
  onEdit?: (poll: Poll) => void
  /** O card inteiro vira link para a tela de dados da pauta no admin. */
  linked?: boolean
}

export interface PollCardLayoutProps extends PollCardProps {
  categoryLook: CategoryLook
  statusLabel: string
  statusClassName: string
  bar?: { segments: { key: string; color: string; percent: number }[]; label: string; forLabel: string }
  /** Imagens ilustrativas: o voto é anônimo, não representam quem votou. */
  participantAvatars: string[]
  participationsLabel?: string
  scheduleLabel?: string
  timeLabel?: string
  onEditClick?: () => void
}
