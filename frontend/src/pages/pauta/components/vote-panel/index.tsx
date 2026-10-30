import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { useVote } from '@/hooks/use-vote'
import { useSession } from '@/lib/auth/client'
import { setPollReminder } from '@/lib/poll/reminders'
import type { VoteOption } from '@/lib/poll/types'

import { VotePanel as Layout } from './layout'
import type { VotePanelLayoutProps, VotePanelProps, VotePanelState } from './data'

export function VotePanel(props: VotePanelProps) {
  const { poll, onVoted } = props
  const { data: session, isPending } = useSession()
  const [option, setOption] = useState<VoteOption>()
  const { submitting, vote } = useVote(poll.id, onVoted)

  function getState(): VotePanelState {
    if (poll.status === 'SCHEDULED') return 'scheduled'
    if (poll.status === 'CLOSED') return 'closed'
    if (isPending) return 'loading'
    if (!session) return 'sign-in'
    if (session.user.role !== 'CITIZEN') return 'not-citizen'
    return poll.hasVoted ? 'voted' : 'vote'
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (option) void vote(option)
  }

  async function toggleReminder() {
    if (await setPollReminder(poll.id, !poll.hasReminder)) onVoted()
  }

  const layoutProps: VotePanelLayoutProps = {
    ...props,
    state: getState(),
    opensLabel: format(new Date(poll.startsAt), "dd 'de' MMMM", { locale: ptBR }),
    reminder: isPending ? undefined : !session ? 'sign-in' : session.user.role === 'CITIZEN' ? 'toggle' : undefined,
    option,
    onOptionChange: setOption,
    submitting,
    onSubmit: handleSubmit,
    onToggleReminder: () => void toggleReminder(),
  }

  return <Layout {...layoutProps} />
}
