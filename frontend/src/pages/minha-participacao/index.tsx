import { useEffect, useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { api } from '@/lib/api/client'
import { getCategoryLook } from '@/lib/poll/categories'

import { MinhaParticipacao as Layout } from './layout'
import type { MinhaParticipacaoLayoutProps, MinhaParticipacaoProps, ParticipationPage } from './data'

const route = getRouteApi('/_autenticado/minha-participacao')

export function MinhaParticipacao(_props: MinhaParticipacaoProps) {
  const navigate = useNavigate()
  const { page = 1, from = 'painel' } = route.useSearch()
  const [data, setData] = useState<ParticipationPage>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    setLoading(true)
    api<ParticipationPage>(`/participations/me?page=${page}&pageSize=9`)
      .then((result) => {
        if (active) {
          setData(result)
          setError(undefined)
        }
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar sua participação.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [page])

  const layoutProps: MinhaParticipacaoLayoutProps = {
    items: (data?.items ?? []).map((item) => ({
      poll: item.poll,
      categoryLook: getCategoryLook(item.poll.category.name),
      participatedAtLabel: format(new Date(item.participatedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
      resultsAvailable: item.resultsAvailable,
    })),
    total: data?.total ?? 0,
    resultsAvailable: data?.resultsAvailable ?? 0,
    page,
    pageSize: data?.pageSize ?? 9,
    loading,
    error,
    onPageChange: (nextPage) =>
      navigate({
        to: '/minha-participacao',
        search: { page: nextPage, from },
      }),
    onBack: () => navigate({ to: from === 'pautas' ? '/pautas' : '/painel' }),
  }

  return <Layout {...layoutProps} />
}
