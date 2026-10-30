import { useCallback, useEffect, useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'

import { useLiveRefresh } from '@/hooks/use-live-refresh'
import { api } from '@/lib/api/client'
import { POLL_STATUS_FILTERS } from '@/lib/poll/status'
import type { PollPage } from '@/lib/poll/types'

import { AdminPautas as Layout } from './layout'
import type { AdminPautasLayoutProps, AdminPautasProps, Category, Poll, StatusFilter } from './data'

const route = getRouteApi('/_autenticado/admin/pautas')

export function AdminPautas(_props: AdminPautasProps) {
  const { q = '', status = 'ALL', nova, editar } = route.useSearch()
  const navigate = useNavigate()
  const [polls, setPolls] = useState<Poll[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(status)
  const [drawer, setDrawer] = useState<{ open: boolean; poll?: Poll }>({ open: false })

  const load = useCallback(async () => {
    try {
      const [firstPage, categoryList] = await Promise.all([
        api<PollPage>('/polls?page=1&pageSize=50'),
        api<Category[]>('/categories'),
      ])
      const remainingPages = await Promise.all(
        Array.from({ length: Math.max(0, Math.ceil(firstPage.total / firstPage.pageSize) - 1) }, (_, index) =>
          api<PollPage>(`/polls?page=${index + 2}&pageSize=${firstPage.pageSize}`),
        ),
      )
      setPolls([...firstPage.items, ...remainingPages.flatMap((page) => page.items)])
      setCategories(categoryList)
      setError(undefined)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar as pautas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useLiveRefresh(['poll-results', 'polls-changed'], () => void load())

  // Atalhos do Início: abrem o painel uma vez e saem da URL para não reabrir ao salvar ou recarregar.
  useEffect(() => {
    const poll = polls.find(({ id }) => id === editar)
    if (loading || (!nova && !poll)) return
    setDrawer({ open: true, poll })
    navigate({ to: '/admin/pautas', search: { q: q || undefined }, replace: true })
  }, [loading, polls, nova, editar, q, navigate])

  const term = q.trim().toLowerCase()
  const matching = polls.filter(
    (poll) => !term || poll.title.toLowerCase().includes(term) || poll.category.name.toLowerCase().includes(term)
  )

  const layoutProps: AdminPautasLayoutProps = {
    filters: POLL_STATUS_FILTERS.map(({ value, label }) => ({
      value,
      label,
      count: matching.filter((poll) => value === 'ALL' || poll.status === value).length,
    })),
    statusFilter,
    onStatusFilterChange: setStatusFilter,
    polls: matching.filter((poll) => statusFilter === 'ALL' || poll.status === statusFilter),
    onEdit: (poll) => setDrawer({ open: true, poll }),
    loading,
    error,
    onNew: () => setDrawer({ open: true }),
    drawer: { ...drawer, categories },
    onDrawerOpenChange: (open) => setDrawer((current) => ({ ...current, open })),
    onSaved: () => {
      setDrawer({ open: false })
      setStatusFilter('ALL')
      load()
    },
  }

  return <Layout {...layoutProps} />
}
