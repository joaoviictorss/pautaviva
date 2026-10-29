import { useCallback, useEffect, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'

import { api } from '@/lib/api/client'

import { AdminPautas as Layout } from './layout'
import type { AdminPautasLayoutProps, AdminPautasProps, Category, Poll, StatusFilter } from './data'

const route = getRouteApi('/_autenticado/admin/pautas')

const FILTERS: [StatusFilter, string][] = [
  ['ALL', 'Todas'],
  ['OPEN', 'Abertas'],
  ['SCHEDULED', 'Agendadas'],
  ['CLOSED', 'Encerradas'],
]

export function AdminPautas(_props: AdminPautasProps) {
  const { q = '' } = route.useSearch()
  const [polls, setPolls] = useState<Poll[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [drawer, setDrawer] = useState<{ open: boolean; poll?: Poll }>({ open: false })

  const load = useCallback(async () => {
    try {
      const [pollList, categoryList] = await Promise.all([
        api<Poll[]>('/polls'),
        api<Category[]>('/categories'),
      ])
      setPolls(pollList)
      setCategories(categoryList)
      setError(undefined)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const term = q.trim().toLowerCase()
  const matching = polls.filter(
    (poll) => !term || poll.title.toLowerCase().includes(term) || poll.category.name.toLowerCase().includes(term)
  )

  const layoutProps: AdminPautasLayoutProps = {
    filters: FILTERS.map(([value, label]) => ({
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
