import { useCallback, useEffect, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { usePollExport } from '@/hooks/use-poll-export'
import { usePollLive, type PollLiveUpdate } from '@/hooks/use-poll-live'
import { api } from '@/lib/api/client'
import { useSession } from '@/lib/auth/client'
import { getCategoryLook } from '@/lib/poll/categories'
import { POLL_STATUS } from '@/lib/poll/status'
import type { PollDetail } from '@/lib/poll/types'
import { getBars } from '@/lib/poll/votes'
import { formatNumber } from '@/lib/utils/format'

import { Pauta as Layout } from './layout'
import type { PautaLayoutProps, PautaProps } from './data'

const route = getRouteApi('/pautas/$pollId')
const longDate = (iso: string) => format(new Date(iso), "dd 'de' MMM 'de' yyyy, HH:mm", { locale: ptBR })

export function Pauta(_props: PautaProps) {
  const { pollId } = route.useParams()
  const [poll, setPoll] = useState<PollDetail>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const { exportingFormat, exportError, exportResults } = usePollExport(pollId)
  const { data: session } = useSession()

  const load = useCallback(async () => {
    try {
      setPoll(await api<PollDetail>(`/polls/${encodeURIComponent(pollId)}`))
      setError(undefined)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a pauta.')
    } finally {
      setLoading(false)
    }
  }, [pollId])

  useEffect(() => {
    void load()
  }, [load])

  const applyResults = useCallback((update: PollLiveUpdate) => {
    setPoll((current) => (current ? { ...current, ...update } : current))
  }, [])

  const sync = useCallback(() => void load(), [load])
  const live = usePollLive(pollId, sync, applyResults)

  const layoutProps: PautaLayoutProps = {
    poll,
    loading,
    error,
    exportError,
    live,
    canExport: ['MANAGER', 'MODERATOR', 'ADMIN'].includes(session?.user.role ?? ''),
    exportingFormat,
    onVoted: () => void load(),
    onExport: (format) => void exportResults(format),
    ...(poll && {
      categoryLook: getCategoryLook(poll.category.name),
      statusLabel: POLL_STATUS[poll.status].label,
      statusClassName: POLL_STATUS[poll.status].className,
      periodLabel: `${longDate(poll.startsAt)} a ${longDate(poll.endsAt)}`,
      participationsLabel: `${formatNumber(poll.participations)} ${poll.participations === 1 ? 'participação' : 'participações'}`,
      bars:
        poll.status === 'SCHEDULED'
          ? undefined
          : getBars({ f: poll.results.FOR, c: poll.results.AGAINST, a: poll.results.ABSTAIN }),
    }),
  }

  return <Layout {...layoutProps} />
}
