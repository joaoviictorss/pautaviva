import type { PollDetail, VoteOption } from '@/lib/poll/types'

export interface VotePanelProps {
  poll: PollDetail
  onVoted: () => void
}

export type VotePanelState = 'loading' | 'vote' | 'sign-in' | 'voted' | 'not-citizen' | 'scheduled' | 'closed'

export interface VotePanelLayoutProps extends VotePanelProps {
  state: VotePanelState
  opensLabel: string
  options: { value: VoteOption; label: string; color: string }[]
  option?: VoteOption
  onOptionChange: (option: VoteOption) => void
  submitting: boolean
  onSubmit: (event: React.FormEvent) => void
}
