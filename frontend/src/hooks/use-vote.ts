import { useState } from 'react'

import { toast } from '@/components/ui/toast'
import { api, ApiError } from '@/lib/api/client'
import type { VoteOption } from '@/lib/poll/types'

export function useVote(pollId: string, onSettled: () => void) {
  const [submitting, setSubmitting] = useState(false)

  async function vote(option: VoteOption) {
    setSubmitting(true)
    try {
      await api(`/polls/${pollId}/votes`, { method: 'POST', json: { option } })
      toast.add({ type: 'success', title: 'Voto registrado', description: 'Obrigado por participar!' })
    } catch (err) {
      toast.add({ type: 'error', title: 'Não foi possível votar', description: (err as Error).message })
      // 409 (já votou) e 400 (pauta fechou) mudam a pauta: recarrega para refletir
      if (!(err instanceof ApiError && (err.status === 409 || err.status === 400))) return
    } finally {
      setSubmitting(false)
    }
    onSettled()
  }

  return { submitting, vote }
}
