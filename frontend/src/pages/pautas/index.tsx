import { useEffect, useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'

import { api } from '@/lib/api/client'
import type { Category, Poll, PollPage } from '@/lib/poll/types'

import { Pautas as Layout } from './layout'
import type { PautasLayoutProps, PautasProps, PollSort, PollStatusFilter } from './data'

const route = getRouteApi('/pautas/')

export function Pautas(_props: PautasProps) {
  const navigate = useNavigate()
  const { categoryId, search, status = 'ALL', sort = 'recent', page = 1 } = route.useSearch()
  const [polls, setPolls] = useState<Poll[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const query = new URLSearchParams()
        if (categoryId) query.set('categoryId', categoryId)
        if (search?.trim()) query.set('search', search.trim())
        if (status !== 'ALL') query.set('status', status)
        query.set('sort', sort)
        query.set('page', String(page))
        const suffix = query.size ? `?${query}` : ''
        const [pollList, categoryList] = await Promise.all([
          api<PollPage>(`/polls${suffix}`),
          api<Category[]>('/categories'),
        ])
        if (active) {
          setPolls(pollList.items)
          setTotal(pollList.total)
          setCategories(categoryList)
          setError(undefined)
          if (pollList.page !== page) {
            navigate({
              to: '/pautas',
              search: { categoryId, search, status, sort, page: pollList.page },
              replace: true,
            })
          }
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar as pautas.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [categoryId, search, status, sort, page, navigate])

  const updateSearch = (values: Partial<{
    categoryId: string
    search: string
    status: PollStatusFilter
    sort: PollSort
    page: number
  }>) =>
    navigate({
      to: '/pautas',
      search: {
        categoryId: 'categoryId' in values ? values.categoryId : categoryId,
        search: 'search' in values ? values.search : search,
        status: values.status ?? status,
        sort: values.sort ?? sort,
        page: values.page ?? (
          'categoryId' in values || 'search' in values || 'status' in values || 'sort' in values ? 1 : page
        ),
      },
      replace: true,
    })

  const layoutProps: PautasLayoutProps = {
    categories,
    polls,
    categoryId: categoryId ?? '',
    status,
    sort,
    page,
    pageSize: 9,
    total,
    search: search ?? '',
    loading,
    error,
    onCategoryChange: (value) => updateSearch({ categoryId: value || undefined }),
    onStatusChange: (value: PollStatusFilter) => updateSearch({ status: value }),
    onSortChange: (value: PollSort) => updateSearch({ sort: value }),
    onPageChange: (value: number) => updateSearch({ page: value }),
    onSearchChange: (value) => updateSearch({ search: value || undefined }),
    onClearFilters: () => updateSearch({ categoryId: undefined, search: undefined, status: 'ALL' }),
  }

  return <Layout {...layoutProps} />
}
