import { useEffect, useState } from 'react'

import { api } from '@/lib/api/client'
import type { Category, Poll } from '@/lib/poll/types'

import { Pautas as Layout } from './layout'
import type { PautasLayoutProps, PautasProps, StatusFilter } from './data'

const FILTERS: [StatusFilter, string][] = [
  ['ALL', 'Todas'],
  ['OPEN', 'Abertas'],
  ['SCHEDULED', 'Agendadas'],
  ['CLOSED', 'Encerradas'],
]

const ALL_CATEGORIES = 'ALL'

export function Pautas(_props: PautasProps) {
  const [polls, setPolls] = useState<Poll[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES)

  useEffect(() => {
    Promise.all([api<Poll[]>('/polls'), api<Category[]>('/categories')])
      .then(([pollList, categoryList]) => {
        setPolls(pollList)
        setCategories(categoryList)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const inCategory = polls.filter((poll) => categoryFilter === ALL_CATEGORIES || poll.category.id === categoryFilter)

  const layoutProps: PautasLayoutProps = {
    filters: FILTERS.map(([value, label]) => ({
      value,
      label,
      count: inCategory.filter((poll) => value === 'ALL' || poll.status === value).length,
    })),
    statusFilter,
    onStatusFilterChange: setStatusFilter,
    categoryOptions: [
      { value: ALL_CATEGORIES, label: 'Todas as categorias' },
      ...categories.map((category) => ({ value: category.id, label: category.name })),
    ],
    categoryFilter,
    onCategoryFilterChange: setCategoryFilter,
    polls: inCategory.filter((poll) => statusFilter === 'ALL' || poll.status === statusFilter),
    loading,
    error,
  }

  return <Layout {...layoutProps} />
}
