export interface RejectCommentDialogProps {
  /** Quantos comentários serão rejeitados; 0 mantém o diálogo fechado. */
  count: number
  /** Comentário já publicado é removido, não rejeitado. */
  removing: boolean
  flagged: boolean
  processing: boolean
  onCancel: () => void
  onConfirm: (reason: string) => void
}

export interface RejectCommentReason {
  label: string
  description: string
}

export interface RejectCommentDialogLayoutProps extends Omit<RejectCommentDialogProps, 'flagged' | 'onConfirm'> {
  title: string
  actionLabel: string
  reasons: RejectCommentReason[]
  reason: string
  onReasonChange: (reason: string) => void
  onSubmit: () => void
}
