import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertCircleIcon, ArrowLeftIcon } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getCategoryLook } from '@/lib/poll/categories'
import { POLL_STATUS } from '@/lib/poll/status'
import { VOTE_OPTIONS } from '@/lib/poll/votes'
import { formatNumber } from '@/lib/utils/format'

import type { PautaLayoutProps } from '../data'

const dateTime = (value: string) => format(new Date(value), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })

export function Pauta({ poll, loading, error }: PautaLayoutProps) {
  const votes = poll ? [poll.results.FOR, poll.results.AGAINST, poll.results.ABSTAIN] : [0, 0, 0]
  const totalVotes = votes.reduce((sum, count) => sum + count, 0)
  const look = poll ? getCategoryLook(poll.category.name) : undefined
  const CategoryIcon = look?.icon

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 text-inherit no-underline">
            <img src="/logo-mark.svg" alt="" className="size-8" />
            <span className="text-lg font-bold tracking-tight text-primary">PautaViva</span>
          </Link>
          <Button nativeButton={false} render={<Link to="/entrar" />} variant="outline" className="rounded-full">
            Entrar
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-8 sm:px-6 sm:py-12">
        <Button
          nativeButton={false}
          variant="ghost"
          render={<Link to="/pautas" />}
          className="w-fit rounded-full px-3 text-muted-foreground"
        >
          <ArrowLeftIcon />
          Todas as pautas
        </Button>

        {error ? (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : loading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-52 rounded-2xl" />
            <Skeleton className="h-44 rounded-2xl" />
          </div>
        ) : poll && look && CategoryIcon ? (
          <>
            <Card className="gap-5 rounded-2xl p-5 sm:p-8">
              <CardHeader className="gap-4 px-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="gap-1.5 px-2.5 py-1 font-semibold" style={look.style}>
                    <CategoryIcon className="size-3.5" />
                    {poll.category.name}
                  </Badge>
                  <Badge className={POLL_STATUS[poll.status].className}>{POLL_STATUS[poll.status].label}</Badge>
                </div>
                <CardTitle className="text-3xl font-extrabold tracking-tight text-pretty sm:text-4xl">
                  {poll.title}
                </CardTitle>
                <CardDescription className="text-base leading-relaxed">{poll.description}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 border-t px-0 pt-5 text-sm sm:grid-cols-2">
                <div>
                  <p className="m-0 text-xs font-medium text-muted-foreground">Início da votação</p>
                  <p className="m-0 mt-1 font-semibold">{dateTime(poll.startsAt)}</p>
                </div>
                <div>
                  <p className="m-0 text-xs font-medium text-muted-foreground">Término da votação</p>
                  <p className="m-0 mt-1 font-semibold">{dateTime(poll.endsAt)}</p>
                </div>
              </CardContent>
            </Card>

            {poll.status !== 'SCHEDULED' && (
              <Card className="gap-4 rounded-2xl p-5 sm:p-8">
                <CardHeader className="px-0">
                  <CardTitle className="text-xl font-bold">Resultados {poll.status === 'OPEN' ? 'parciais' : 'finais'}</CardTitle>
                  <CardDescription>
                    {formatNumber(poll.participations)}{' '}
                    {poll.participations === 1 ? 'participação registrada' : 'participações registradas'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 px-0">
                  {VOTE_OPTIONS.map((option, index) => {
                    const count = votes[index]
                    const percent = totalVotes ? Math.round((count / totalVotes) * 1000) / 10 : 0
                    return (
                      <div key={option.key} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-semibold">{option.label}</span>
                          <span className="text-muted-foreground">
                            {formatNumber(count)} · {percent}%
                          </span>
                        </div>
                        <div
                          role="img"
                          aria-label={`${option.label}: ${percent}%`}
                          className="h-2.5 overflow-hidden rounded-full bg-muted"
                        >
                          <div className="h-full rounded-full" style={{ width: `${percent}%`, background: option.color }} />
                        </div>
                      </div>
                    )
                  })}
                  <p className="m-0 border-t pt-3 text-xs text-muted-foreground">
                    Resultados agregados; votos individuais não são exibidos.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        ) : null}
      </main>
    </div>
  )
}
