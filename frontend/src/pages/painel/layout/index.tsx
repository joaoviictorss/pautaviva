import { Link } from '@tanstack/react-router'
import { ArrowRightIcon, LayoutDashboardIcon, ListChecksIcon, LogOutIcon, SearchIcon } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

import type { PainelLayoutProps } from '../data'

export function Painel({ name, firstName, initials, email, image, roleLabel, isStaff, signingOut, onSignOut }: PainelLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 text-inherit no-underline">
            <img src="/logo-mark.svg" alt="" className="block size-8" />
            <span className="text-lg font-bold tracking-tight text-primary">PautaViva</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2.5 sm:flex">
              <Avatar>
                {image && <AvatarImage src={image} alt="" />}
                <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
                  {initials}
                </AvatarFallback>
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

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-2">
          <h1 className="m-0 text-3xl font-bold tracking-tight">Olá, {firstName}</h1>
          <p className="m-0 text-muted-foreground">Consulte as pautas e acompanhe as decisões da sua comunidade.</p>
        </div>

        <Button
          nativeButton={false}
          render={<Link to="/pautas" />}
          className="group h-12 w-fit gap-3 rounded-xl px-6 text-base shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <SearchIcon className="size-5" />
          Explorar pautas
          <ArrowRightIcon className="size-5 transition-transform group-hover:translate-x-0.5" />
        </Button>

        <div className="flex max-w-md items-center gap-3.5 rounded-xl border bg-card p-4">
          <Avatar className="size-12">
            {image && <AvatarImage src={image} alt="" />}
            <AvatarFallback className="bg-accent font-semibold text-accent-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="font-semibold">{name}</span>
            <span className="truncate text-sm text-muted-foreground">{email}</span>
          </div>
          <Badge variant="secondary" className="bg-accent text-accent-foreground">
            {roleLabel}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button render={<Link to="/pautas" />} className="w-fit">
            <ListChecksIcon />
            Ver pautas
          </Button>
          {isStaff && (
            <Button render={<Link to="/admin/pautas" />} variant="outline" className="w-fit">
              <LayoutDashboardIcon />
              Área administrativa
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}
