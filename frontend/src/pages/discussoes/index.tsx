import { useEffect, useState } from 'react'

import { useLiveRefresh } from '@/hooks/use-live-refresh'
import { api } from '@/lib/api/client'
import type { PollPage } from '@/lib/poll/types'

import { Discussoes as Layout } from './layout'
import type { DiscussoesLayoutProps, DiscussoesProps } from './data'

export function Discussoes(_props: DiscussoesProps) {
  const [polls, setPolls] = useState<PollPage['items']>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [reloads, setReloads] = useState(0)

  useLiveRefresh(['poll-results', 'polls-changed'], () => setReloads((current) => current + 1))

  useEffect(() => {
    let active = true
    api<PollPage>('/polls?status=OPEN&pageSize=50&sort=ending')
      .then((result) => {
        if (active) {
          setPolls(result.items)
          setError(undefined)
        }
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar as discussões.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [reloads])

  const layoutProps: DiscussoesLayoutProps = { polls, loading, error }
  return <Layout {...layoutProps} />
}
