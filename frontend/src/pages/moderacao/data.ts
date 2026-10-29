export interface ModerationComment {
  id: string
  text: string
  createdAt: string
  status: 'PENDING' | 'APPROVED'
  classification: 'ADEQUATE' | 'SUSPECT' | 'INAPPROPRIATE' | null
  moderationReason: string | null
  reports: { reason: 'OFFENSIVE_CONTENT' | 'SPAM' | 'HATE_SPEECH' | 'OTHER'; createdAt: string }[]
  author: { name: string }
  poll: { id: string; title: string }
}

export type ModerationAction = 'APPROVE' | 'REJECT' | 'REMOVE' | 'DISMISS_REPORT'

export interface ModeracaoProps {}

export interface ModeracaoLayoutProps extends ModeracaoProps {
  comments: ModerationComment[]
  loading: boolean
  error?: string
  processingId?: string
  onDecision: (id: string, action: ModerationAction) => void
}
