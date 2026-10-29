import { useCallback, useEffect, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { io } from 'socket.io-client'

import { env } from '@/env'
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
  const [live, setLive] = useState(false)
  const [exportingFormat, setExportingFormat] = useState<'csv' | 'pdf'>()
  const [exportError, setExportError] = useState<string>()
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

  useEffect(() => {
    const socket = io(env.VITE_API_URL, { withCredentials: true })
    socket.on('connect', () => {
      socket.emit('join-poll', pollId)
      setLive(true)
      void load()
    })
    socket.on('disconnect', () => setLive(false))
    socket.on('poll-results', (update: Pick<PollDetail, 'results' | 'participations'>) => {
      setPoll((current) => (current ? { ...current, ...update } : current))
    })
    return () => {
      socket.disconnect()
    }
  }, [pollId, load])

  const exportResults = useCallback(async (format: 'csv' | 'pdf') => {
    setExportError(undefined)
    setExportingFormat(format)
    try {
      const response = await fetch(
        `${env.VITE_API_URL}/polls/${encodeURIComponent(pollId)}/export?format=${format}`,
        { credentials: 'include' },
      )
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.message ?? 'Não foi possível exportar os resultados.')
      }

      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition?.match(/filename="([^"]+)"/)?.[1] ?? `resultados-${pollId}.${format}`
      const url = URL.createObjectURL(await response.blob())
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.append(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1_000)
    } catch (exportFailure) {
      setExportError(exportFailure instanceof Error ? exportFailure.message : 'Não foi possível exportar os resultados.')
    } finally {
      setExportingFormat(undefined)
    }
  }, [pollId])

  const layoutProps: PautaLayoutProps = {
    poll,
    loading,
    error,
    exportError,
    live,
    canExport: session?.user.role === 'MANAGER' || session?.user.role === 'ADMIN',
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
