import { useEffect, useRef, useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { LayoutGridIcon } from 'lucide-react'

import { useLiveRefresh } from '@/hooks/use-live-refresh'
import { api } from '@/lib/api/client'
import { useSession } from '@/lib/auth/client'
import { getCategoryChipStyle, getCategoryLook } from '@/lib/poll/categories'
import { setPollReminder } from '@/lib/poll/reminders'
import type { PollStatus } from '@/lib/poll/status'
import type { Category, Poll, PollPage } from '@/lib/poll/types'

import { Pautas as Layout } from './layout'
import type { PautasLayoutProps, PautasProps } from './data'

const route = getRouteApi('/_comunidade/pautas/')

const ALL_CATEGORIES = 'ALL'

const STATUS_SORT: Record<PollStatus, string> = { OPEN: 'ending', SCHEDULED: 'start', CLOSED: 'ending' }

interface PautasSearch {
  categoryId?: string
  q?: string
  status: PollStatus
  missing?: boolean
  page?: number
}

export function Pautas(_props: PautasProps) {
  const navigate = useNavigate()
  const { data: session } = useSession()
  const { categoryId, q, status = 'OPEN', missing, page = 1 } = route.useSearch()
  const [polls, setPolls] = useState<Poll[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [counts, setCounts] = useState<PollPage['counts']>()
  const [voting, setVoting] = useState<Poll>()
  const [reloads, setReloads] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const role = session?.user.role
  const viewer = !session ? 'visitor' : role === 'CITIZEN' ? 'citizen' : 'staff'
  const onlyMissing = !!missing && status === 'OPEN'
  // atualização ao vivo troca os cards sem passar pelo skeleton
  const silentReload = useRef(false)

  useLiveRefresh(['poll-results', 'polls-changed'], () => {
    silentReload.current = true
    setReloads((current) => current + 1)
  })

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!silentReload.current) setLoading(true)
      silentReload.current = false
      try {
        const query = new URLSearchParams({
          status,
          sort: STATUS_SORT[status],
          page: String(page),
        })
        if (categoryId) query.set('categoryId', categoryId)
        if (q?.trim()) query.set('search', q.trim())
        if (onlyMissing) query.set('missing', 'true')
        const [pollList, categoryList] = await Promise.all([
          api<PollPage>(`/polls?${query}`),
          api<Category[]>('/categories'),
        ])
        if (active) {
          setPolls(pollList.items)
          setTotal(pollList.total)
          setCounts(pollList.counts)
          setCategories(categoryList)
          setError(undefined)
          if (pollList.page !== page) {
            navigate({ to: '/pautas', search: { categoryId, q, status, missing, page: pollList.page }, replace: true })
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
  }, [categoryId, q, status, missing, onlyMissing, page, reloads, navigate])

  const updateSearch = (values: Partial<PautasSearch>) =>
    navigate({
      to: '/pautas',
      search: { categoryId, q, status, missing, page: undefined, ...values },
      replace: true,
    })

  async function toggleReminder(poll: Poll) {
    const active = !poll.hasReminder
    if (!(await setPollReminder(poll.id, active))) return
    setPolls((current) => current.map((item) => (item.id === poll.id ? { ...item, hasReminder: active } : item)))
  }

  const layoutProps: PautasLayoutProps = {
    viewer,
    polls,
    statusFilters: [
      { value: 'OPEN', label: 'Abertas', count: counts?.OPEN },
      { value: 'CLOSED', label: 'Encerradas', count: counts?.CLOSED },
      { value: 'SCHEDULED', label: 'Em breve', count: counts?.SCHEDULED },
    ],
    status,
    categoryFilters: [
      {
        value: ALL_CATEGORIES,
        label: 'Todas',
        icon: LayoutGridIcon,
        activeStyle: { backgroundColor: 'var(--foreground)', color: 'var(--background)', borderColor: 'var(--foreground)' },
      },
      ...categories.map(({ id, name }) => ({
        value: id,
        label: name,
        icon: getCategoryLook(name).icon,
        activeStyle: getCategoryChipStyle(name),
      })),
    ],
    categoryId: categoryId ?? ALL_CATEGORIES,
    missing: onlyMissing,
    showMissing: viewer === 'citizen' && status === 'OPEN',
    page,
    pageSize: 9,
    total,
    hasActiveFilters: Boolean(q?.trim() || categoryId || onlyMissing),
    voting,
    loading,
    error,
    onCategoryChange: (value) => updateSearch({ categoryId: value === ALL_CATEGORIES ? undefined : value }),
    onStatusChange: (value) => updateSearch({ status: value, missing: undefined }),
    onMissingChange: (value) => updateSearch({ missing: value || undefined }),
    onPageChange: (value) => updateSearch({ page: value }),
    onClearFilters: () => updateSearch({ categoryId: undefined, q: undefined, missing: undefined }),
    onVote: setVoting,
    onCloseVote: () => setVoting(undefined),
    onVoted: () => setReloads((current) => current + 1),
    onToggleReminder: (poll) => void toggleReminder(poll),
  }

  return <Layout {...layoutProps} />
}
