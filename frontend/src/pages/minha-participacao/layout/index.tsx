import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon, ArrowRightIcon, CheckCheckIcon, CircleAlertIcon } from 'lucide-react'

import { CommunityNavigation } from '@/components/community-navigation'
import { SiteHeader } from '@/components/site-header'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'

import type { MinhaParticipacaoLayoutProps } from '../data'

export function MinhaParticipacao({
  items,
  total,
  resultsAvailable,
  page,
  pageSize,
  loading,
  error,
  onPageChange,
  onBack,
}: MinhaParticipacaoLayoutProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <CommunityNavigation active="minha-participacao">
        <Button onClick={onBack} variant="link" className="w-fit px-0">
          <ArrowLeftIcon />
          Voltar
        </Button>

        <header className="flex flex-col gap-2">
          <h1 className="m-0 text-3xl font-bold tracking-tight">Minha participação</h1>
          <p className="m-0 text-muted-foreground">
            Acompanhe seu histórico. Esta página não registra nem revela em qual opção você votou.
          </p>
        </header>

        {error && (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertTitle>Não foi possível carregar sua participação</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <section className="grid gap-3 sm:grid-cols-2" aria-label="Resumo da participação">
          <Card className="rounded-2xl">
            <CardHeader className="gap-1">
              <CardDescription>Votações em que participou</CardDescription>
              <CardTitle className="text-3xl">{loading ? <Skeleton className="h-9 w-16" /> : total}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-2xl">
            <CardHeader className="gap-1">
              <CardDescription>Com resultados disponíveis</CardDescription>
              <CardTitle className="text-3xl">{loading ? <Skeleton className="h-9 w-16" /> : resultsAvailable}</CardTitle>
            </CardHeader>
          </Card>
        </section>

        <section aria-label="Histórico de participação">
          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-24 rounded-2xl" />)}
            </div>
          ) : error ? null : items.length ? (
            <div className="flex flex-col gap-3">
              {items.map((item) => {
                const CategoryIcon = item.categoryLook.icon
                return (
                  <Card key={item.poll.id} className="gap-0 rounded-2xl">
                    <CardContent className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={item.categoryLook.style}>
                        <CategoryIcon className="size-5" />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <h2 className="m-0 text-base font-semibold">{item.poll.title}</h2>
                        <p className="m-0 text-sm text-muted-foreground">
                          {item.poll.category.name} · Participou em {item.participatedAtLabel}
                        </p>
                      </div>
                      <Badge variant={item.resultsAvailable ? 'secondary' : 'outline'}>
                        {item.resultsAvailable ? 'Resultados disponíveis' : 'Votação ainda não iniciada'}
                      </Badge>
                      <Button
                        render={<Link to="/pautas/$pollId" params={{ pollId: item.poll.id }} />}
                        variant="outline"
                        size="sm"
                      >
                        {item.resultsAvailable ? 'Ver resultados' : 'Ver pauta'}
                        <ArrowRightIcon />
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}

              {totalPages > 1 && (
                <nav aria-label="Paginação do histórico" className="flex items-center justify-between gap-3 pt-2">
                  <p className="m-0 text-sm text-muted-foreground">
                    Página {page} de {totalPages} · {total} {total === 1 ? 'participação' : 'participações'}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => onPageChange(page + 1)}
                    >
                      Próxima
                    </Button>
                  </div>
                </nav>
              )}
            </div>
          ) : (
            <Empty className="min-h-80 gap-5 rounded-3xl border bg-gradient-to-b from-accent/35 via-background to-background px-6 py-12 shadow-sm">
              <EmptyHeader className="max-w-md gap-3">
                <EmptyMedia
                  variant="icon"
                  className="mb-1 size-16 rounded-2xl bg-accent text-accent-foreground shadow-sm [&_svg:not([class*='size-'])]:size-7"
                >
                  <CheckCheckIcon aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle className="text-xl font-semibold">
                  Sua participação começa com uma pauta
                </EmptyTitle>
                <EmptyDescription className="max-w-sm text-pretty">
                  Você ainda não participou de uma votação. Explore as pautas abertas e acompanhe suas contribuições
                  por aqui, sem revelar em qual opção votou.
                </EmptyDescription>
              </EmptyHeader>
              <Button
                nativeButton={false}
                render={<Link to="/pautas" search={{ status: 'OPEN' }} />}
                className="mt-1 h-10 rounded-full px-5"
              >
                Explorar pautas abertas
                <ArrowRightIcon />
              </Button>
            </Empty>
          )}
        </section>
      </CommunityNavigation>
    </div>
  )
}
