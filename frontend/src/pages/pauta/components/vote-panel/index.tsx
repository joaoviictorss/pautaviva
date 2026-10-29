import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { toast } from '@/components/ui/toast'
import { api, ApiError } from '@/lib/api/client'
import { useSession } from '@/lib/auth/client'
import type { VoteOption } from '@/lib/poll/types'
import { VOTE_OPTIONS } from '@/lib/poll/votes'

import { VotePanel as Layout } from './layout'
import type { VotePanelLayoutProps, VotePanelProps, VotePanelState } from './data'

const OPTION_KEYS: VoteOption[] = ['FOR', 'AGAINST', 'ABSTAIN']

export function VotePanel(props: VotePanelProps) {
  const { poll, onVoted } = props
  const { data: session, isPending } = useSession()
  const [option, setOption] = useState<VoteOption>()
  const [submitting, setSubmitting] = useState(false)

  function getState(): VotePanelState {
    if (poll.status === 'SCHEDULED') return 'scheduled'
    if (poll.status === 'CLOSED') return 'closed'
    if (isPending) return 'loading'
    if (!session) return 'sign-in'
    if (session.user.role !== 'CITIZEN') return 'not-citizen'
    return poll.hasVoted ? 'voted' : 'vote'
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!option) return

    setSubmitting(true)
    try {
      await api(`/polls/${poll.id}/votes`, { method: 'POST', json: { option } })
      toast.add({ type: 'success', title: 'Voto registrado', description: 'Obrigado por participar!' })
    } catch (err) {
      toast.add({ type: 'error', title: 'Não foi possível votar', description: (err as Error).message })
      // 409 (já votou) e 400 (pauta fechou) mudam a pauta: recarrega para refletir
      if (!(err instanceof ApiError && (err.status === 409 || err.status === 400))) return
    } finally {
      setSubmitting(false)
    }
    onVoted()
  }

  const layoutProps: VotePanelLayoutProps = {
    ...props,
    state: getState(),
    opensLabel: format(new Date(poll.startsAt), "dd 'de' MMMM", { locale: ptBR }),
    options: VOTE_OPTIONS.map(({ label, color }, i) => ({ value: OPTION_KEYS[i], label, color })),
    option,
    onOptionChange: setOption,
    submitting,
    onSubmit: handleSubmit,
  }

  return <Layout {...layoutProps} />
}
