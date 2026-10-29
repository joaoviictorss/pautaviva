export interface ModerationComment {
  id: string
  text: string
  createdAt: string
  classification: 'ADEQUATE' | 'SUSPECT' | 'INAPPROPRIATE' | null
  moderationReason: string | null
  author: { name: string }
  poll: { id: string; title: string }
}

export interface ModeracaoProps {}

export interface ModeracaoLayoutProps extends ModeracaoProps {
  comments: ModerationComment[]
  loading: boolean
  error?: string
  processingId?: string
  onDecision: (id: string, status: 'APPROVED' | 'REJECTED') => void
}
