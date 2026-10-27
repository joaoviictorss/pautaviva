import { Link, Outlet } from '@tanstack/react-router'
import { SearchIcon } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'

import type { AdminLayoutProps } from '../data'

const NAV_LINK =
  'font-semibold no-underline hover:no-underline data-[status=active]:bg-primary data-[status=active]:text-primary-foreground data-[status=active]:hover:bg-primary/90 data-[status=active]:hover:text-primary-foreground'

export function Admin({ name, initials, image, roleLabel, nav, search, searchPlaceholder, onSearchChange }: AdminLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-17 items-center gap-4 border-b bg-card px-3 sm:px-7">
        <Link to="/painel" className="flex shrink-0 items-center gap-2.5 no-underline hover:no-underline lg:w-51">
          <img src="/logo-mark.svg" alt="" className="block size-8.5" />
          <span className="text-lg font-bold tracking-tight text-primary">PautaViva</span>
        </Link>

        <div className="flex min-w-0 flex-1 justify-end">
          <InputGroup className="h-11 max-w-105 rounded-xl">
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              aria-label="Buscar"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </InputGroup>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <Avatar className="size-9.5">
            {image && <AvatarImage src={image} alt="" />}
            <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden flex-col leading-tight lg:flex">
            <span className="text-sm font-semibold">{name}</span>
            <span className="text-xs text-muted-foreground">{roleLabel}</span>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav aria-label="Administração" className="hidden w-58 shrink-0 flex-col gap-1 border-r bg-card px-3.5 py-5 lg:flex">
          <span className="px-3 pb-2 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">Painel</span>
          {nav.map((item) => (
            <Button
              key={item.to}
              variant="ghost"
              render={<Link to={item.to} />}
              className={`${NAV_LINK} h-11 justify-start gap-3 rounded-xl px-3`}
            >
              <item.icon className="size-4.5" />
              {item.label}
            </Button>
          ))}
        </nav>

        <main className="min-w-0 flex-1 px-3.5 pt-4 pb-20 sm:px-10 sm:pt-9">
          {nav.length > 1 && (
            <div className="mb-5 flex gap-2 lg:hidden">
              {nav.map((item) => (
                <Button
                  key={item.to}
                  variant="outline"
                  render={<Link to={item.to} />}
                  className={`${NAV_LINK} h-9.5 rounded-full px-4`}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  )
}
