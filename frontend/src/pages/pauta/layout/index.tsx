import { Link } from '@tanstack/react-router'
import { ArrowDownToLineIcon, ArrowLeftIcon, CalendarIcon, CircleAlertIcon, UsersIcon } from 'lucide-react'

import { PollResultBars } from '@/components/poll-result-bars'
import { SiteHeader } from '@/components/site-header'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import { VotePanel } from '../components/vote-panel'
import { Comments } from '../components/comments'
import type { PautaLayoutProps } from '../data'

export function Pauta({
  poll,
  loading,
  error,
  exportError,
  live,
  canExport,
  exportingFormat,
  categoryLook,
  statusLabel,
  statusClassName,
  periodLabel,
  participationsLabel,
  bars,
  onVoted,
  onExport,
}: PautaLayoutProps) {
  const CategoryIcon = categoryLook?.icon

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <Button nativeButton={false} render={<Link to="/pautas" />} variant="link" className="w-fit px-0">
          <ArrowLeftIcon />
          Todas as pautas
        </Button>

        {error ? (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : loading || !poll ? (
          <Skeleton className="h-80 rounded-2xl" />
        ) : (
          <div className="flex flex-col gap-6">
            <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
              <article className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="h-7 gap-1.5 pr-2.5 pl-2 font-semibold" style={categoryLook?.style}>
                    {CategoryIcon && <CategoryIcon />}
                    {poll.category.name}
                  </Badge>
                  <Badge className={`h-6 px-2.5 font-semibold ${statusClassName ?? ''}`}>{statusLabel}</Badge>
                </div>
                <h1 className="m-0 text-[clamp(26px,3.4vw,40px)] font-extrabold tracking-tighter text-pretty">
                  {poll.title}
                </h1>
                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarIcon className="size-4" />
                    {periodLabel}
                  </span>
                  {participationsLabel && (
                    <span className="inline-flex items-center gap-1.5">
                      <UsersIcon className="size-4" />
                      {participationsLabel}
                    </span>
                  )}
                </div>
              </div>

              <p className="m-0 leading-relaxed whitespace-pre-line">{poll.description}</p>

              {poll.status === 'CLOSED' && canExport && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-sm font-semibold">Exportar resultados:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!!exportingFormat}
                    onClick={() => onExport('csv')}
                  >
                    <ArrowDownToLineIcon />
                    {exportingFormat === 'csv' ? 'Gerando CSV...' : 'CSV'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!!exportingFormat}
                    onClick={() => onExport('pdf')}
                  >
                    <ArrowDownToLineIcon />
                    {exportingFormat === 'pdf' ? 'Gerando PDF...' : 'PDF'}
                  </Button>
                  {exportError && (
                    <Alert variant="destructive" className="basis-full">
                      <CircleAlertIcon />
                      <AlertDescription>{exportError}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {bars && (
                <Card className="gap-4 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2.5 text-lg font-bold tracking-tight">
                      {poll.status === 'OPEN' ? 'Resultado parcial' : 'Resultado final'}
                      {poll.status === 'OPEN' && live && (
                        <Badge variant="outline" className="gap-1.5 font-semibold">
                          <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                          Ao vivo
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>Resultados agregados — votos individuais não são exibidos.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <PollResultBars bars={bars} />
                  </CardContent>
                </Card>
              )}
              </article>

              <aside className="lg:sticky lg:top-24">
                <VotePanel poll={poll} onVoted={onVoted} />
              </aside>
            </div>
            <Comments pollId={poll.id} commentable={poll.status === 'OPEN'} />
          </div>
        )}
      </main>
    </div>
  )
}
