import { useEffect, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'

import { api } from '@/lib/api/client'
import type { Poll } from '@/lib/poll/types'

import { Pauta as Layout } from './layout'
import type { PautaLayoutProps, PautaProps } from './data'

const route = getRouteApi('/pautas/$pollId')

export function Pauta(_props: PautaProps) {
  const { pollId } = route.useParams()
  const [poll, setPoll] = useState<Poll>()
  const [loadedPollId, setLoadedPollId] = useState<string>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    api<Poll>(`/polls/${encodeURIComponent(pollId)}`)
      .then((result) => {
        if (active) {
          setPoll(result)
          setLoadedPollId(pollId)
          setError(undefined)
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setLoadedPollId(pollId)
          setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a pauta.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [pollId])

  const layoutProps: PautaLayoutProps = {
    poll: loadedPollId === pollId ? poll : undefined,
    loading: loading || loadedPollId !== pollId,
    error: loadedPollId === pollId ? error : undefined,
  }
  return <Layout {...layoutProps} />
}
