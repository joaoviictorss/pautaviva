import { Link } from '@tanstack/react-router'
import {
  ArrowRightIcon,
  CalendarClockIcon,
  CheckCheckIcon,
  Clock3Icon,
  ListChecksIcon,
  LogOutIcon,
  SearchIcon,
  type LucideIcon,
} from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

import type { PainelLayoutProps, PainelPoll } from '../data'

function ShortcutCard({
  to,
  icon: Icon,
  title,
  description,
}: {
  to: '/minha-participacao'
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-3 rounded-xl border bg-card p-4 text-inherit no-underline transition-colors hover:border-primary/40 hover:bg-muted/40 hover:no-underline"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        <Icon className="size-5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-semibold">{title}</span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </span>
      <ArrowRightIcon className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

function PollRow({ item }: { item: PainelPoll }) {
  const CategoryIcon = item.categoryLook.icon

  return (
    <Link
      to="/pautas/$pollId"
      params={{ pollId: item.poll.id }}
      className="flex items-start gap-3 rounded-xl border p-3.5 text-inherit no-underline transition-colors hover:bg-muted/50 hover:no-underline"
    >
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg" style={item.categoryLook.style}>
        <CategoryIcon className="size-4" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="line-clamp-2 font-semibold leading-snug">{item.poll.title}</span>
        <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge className={cn('h-5 px-2 text-[11px]', item.statusClassName)}>{item.statusLabel}</Badge>
          <span>{item.poll.category.name}</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            {item.poll.status === 'OPEN' ? <Clock3Icon className="size-3.5" /> : <CalendarClockIcon className="size-3.5" />}
            {item.dateLabel}
          </span>
        </span>
      </span>
      <ArrowRightIcon className="mt-1 size-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}

export function Painel({
  name,
  firstName,
  initials,
  email,
  image,
  roleLabel,
  signingOut,
  onSignOut,
  openPolls,
  scheduledPolls,
  participationCount,
  resultsAvailableCount,
  recentParticipations,
  loadingDashboard,
  dashboardError,
  onRetry,
}: PainelLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 text-inherit no-underline">
            <img src="/logo-mark.svg" alt="" className="block size-8" />
            <span className="text-lg font-bold tracking-tight text-primary">PautaViva</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2.5 sm:flex">
              <Avatar>
                {image && <AvatarImage src={image} alt="" />}
                <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{name}</span>
            </div>
            <Button variant="outline" onClick={onSignOut} disabled={signingOut}>
              {signingOut ? <Spinner /> : <LogOutIcon />}
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-2">
          <h1 className="m-0 text-3xl font-bold tracking-tight">Olá, {firstName}</h1>
          <p className="m-0 text-muted-foreground">Consulte as pautas e acompanhe as decisões da sua comunidade.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            nativeButton={false}
            render={<Link to="/pautas" />}
            className="group h-12 w-fit gap-3 rounded-xl px-6 text-base shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <SearchIcon className="size-5" />
            Explorar pautas
            <ArrowRightIcon className="size-5 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>

        <section className="flex flex-col gap-3" aria-label="Acessos rápidos">
          <h2 className="m-0 text-lg font-bold tracking-tight">Acessos rápidos</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ShortcutCard
              to="/minha-participacao"
              icon={CheckCheckIcon}
              title="Minha participação"
              description="Consulte seu histórico e acompanhe resultados."
            />
          </div>
        </section>

        {dashboardError && (
          <Alert variant="destructive">
            <AlertTitle>Não foi possível carregar o resumo</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>{dashboardError}</span>
              <Button variant="outline" size="sm" onClick={onRetry}>Tentar novamente</Button>
            </AlertDescription>
          </Alert>
        )}

        <section className="grid gap-4 lg:grid-cols-2" aria-label="Pautas para acompanhar">
          <Card className="gap-4 rounded-2xl">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ListChecksIcon className="size-5 text-primary" />
                  Em votação
                </CardTitle>
                <CardDescription>Pautas abertas para participação agora.</CardDescription>
              </div>
              <Button nativeButton={false} render={<Link to="/pautas" search={{ status: 'OPEN' }} />} variant="ghost" size="sm" className="shrink-0">
                Ver todas
                <ArrowRightIcon />
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              {loadingDashboard ? (
                Array.from({ length: 2 }, (_, index) => <Skeleton key={index} className="h-[76px] rounded-xl" />)
              ) : openPolls.length ? (
                openPolls.map((item) => <PollRow key={item.poll.id} item={item} />)
              ) : (
                <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed p-4">
                  <p className="m-0 font-medium">Nenhuma pauta aberta para votação no momento.</p>
                  <p className="m-0 text-sm text-muted-foreground">Confira as próximas pautas ou explore a comunidade.</p>
                  <Button nativeButton={false} render={<Link to="/pautas" />} variant="outline" size="sm" className="mt-1">
                    Explorar pautas
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="gap-4 rounded-2xl">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarClockIcon className="size-5 text-primary" />
                  Próximas pautas
                </CardTitle>
                <CardDescription>Votações agendadas para começar em breve.</CardDescription>
              </div>
              <Button nativeButton={false} render={<Link to="/pautas" search={{ status: 'SCHEDULED' }} />} variant="ghost" size="sm" className="shrink-0">
                Ver todas
                <ArrowRightIcon />
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              {loadingDashboard ? (
                Array.from({ length: 2 }, (_, index) => <Skeleton key={index} className="h-[76px] rounded-xl" />)
              ) : scheduledPolls.length ? (
                scheduledPolls.map((item) => <PollRow key={item.poll.id} item={item} />)
              ) : (
                <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed p-4">
                  <p className="m-0 font-medium">Nenhuma votação agendada no momento.</p>
                  <p className="m-0 text-sm text-muted-foreground">As novas pautas aparecerão aqui assim que forem publicadas.</p>
                  <Button nativeButton={false} render={<Link to="/pautas" />} variant="outline" size="sm" className="mt-1">
                    Explorar pautas
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section aria-label="Resumo da sua participação">
          <Card className="gap-5 rounded-2xl">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCheckIcon className="size-5 text-primary" />
                    Minha participação
                  </CardTitle>
                  <CardDescription>Seu histórico registra participação, sem revelar em qual opção você votou.</CardDescription>
                </div>
                <Button nativeButton={false} render={<Link to="/minha-participacao" />} variant="ghost" size="sm">
                  Histórico completo
                  <ArrowRightIcon />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {loadingDashboard ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Skeleton className="h-20 rounded-xl" />
                  <Skeleton className="h-20 rounded-xl" />
                </div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border bg-muted/20 p-4">
                      <p className="m-0 text-sm text-muted-foreground">Votações em que participou</p>
                      <p className="m-0 mt-1 text-2xl font-bold">{participationCount}</p>
                    </div>
                    <div className="rounded-xl border bg-muted/20 p-4">
                      <p className="m-0 text-sm text-muted-foreground">Com resultados disponíveis</p>
                      <p className="m-0 mt-1 text-2xl font-bold">{resultsAvailableCount}</p>
                    </div>
                  </div>

                  {recentParticipations.length ? (
                    <div className="flex flex-col gap-2.5">
                      <h2 className="m-0 text-sm font-semibold">Participações recentes</h2>
                      {recentParticipations.map((item) => {
                        const CategoryIcon = item.categoryLook.icon
                        return (
                          <Link
                            key={item.poll.id}
                            to="/pautas/$pollId"
                            params={{ pollId: item.poll.id }}
                            className="flex items-center gap-3 rounded-xl border p-3.5 text-inherit no-underline transition-colors hover:bg-muted/50 hover:no-underline"
                          >
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg" style={item.categoryLook.style}>
                              <CategoryIcon className="size-4" />
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col gap-1">
                              <span className="truncate font-semibold">{item.poll.title}</span>
                              <span className="text-xs text-muted-foreground">
                                Participou em {item.participatedAtLabel} · {item.resultsAvailable ? 'Resultados disponíveis' : 'Votação ainda não iniciada'}
                              </span>
                            </span>
                            <span className="shrink-0 text-sm font-medium text-primary">
                              {item.resultsAvailable ? 'Ver resultados' : 'Ver pauta'}
                            </span>
                            <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
                          </Link>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed p-4">
                      <p className="m-0 font-medium">Você ainda não participou de nenhuma votação.</p>
                      <p className="m-0 text-sm text-muted-foreground">Encontre uma pauta aberta e registre sua participação.</p>
                      <Button nativeButton={false} render={<Link to="/pautas" search={{ status: 'OPEN' }} />} size="sm" className="mt-1">
                        Ver pautas abertas
                        <ArrowRightIcon />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </section>

        <div className="flex max-w-md items-center gap-3.5 rounded-xl border bg-card p-4">
          <Avatar className="size-12">
            {image && <AvatarImage src={image} alt="" />}
            <AvatarFallback className="bg-accent font-semibold text-accent-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="font-semibold">{name}</span>
            <span className="truncate text-sm text-muted-foreground">{email}</span>
          </div>
          <Badge variant="secondary" className="bg-accent text-accent-foreground">{roleLabel}</Badge>
        </div>
      </main>
    </div>
  )
}
