import type { ReactNode } from 'react'

import type { CategoryLook } from '@/lib/poll/categories'
import type { Poll } from '@/lib/poll/types'

export interface PollCardProps {
  poll: Poll
  /** Mostra o botão "Editar" (só aparece em pautas agendadas). */
  onEdit?: (poll: Poll) => void
  /** O card inteiro vira link para esta tela da pauta. */
  linkTo?: '/admin/pautas/$pollId' | '/pautas/$pollId'
  /** Área do cidadão: prazo no topo, sem avatares. */
  citizen?: boolean
  /** Ação no rodapé, acima do link do card. */
  action?: ReactNode
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
  citizenTimeLabel?: string
  onEditClick?: () => void
}
