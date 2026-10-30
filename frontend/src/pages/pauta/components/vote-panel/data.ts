import type { PollDetail, VoteOption } from '@/lib/poll/types'

export interface VotePanelProps {
  poll: PollDetail
  onVoted: () => void
}

export type VotePanelState = 'loading' | 'vote' | 'sign-in' | 'voted' | 'not-citizen' | 'scheduled' | 'closed'

export interface VotePanelLayoutProps extends VotePanelProps {
  state: VotePanelState
  opensLabel: string
  /** Só cidadãos ativam lembrete; visitante vai para o login e a equipe não vê o botão. */
  reminder?: 'toggle' | 'sign-in'
  option?: VoteOption
  onOptionChange: (option: VoteOption) => void
  submitting: boolean
  onSubmit: (event: React.FormEvent) => void
  onToggleReminder: () => void
}
