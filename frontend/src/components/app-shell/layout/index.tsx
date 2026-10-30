import { Link, Outlet } from '@tanstack/react-router'
import { ChevronDownIcon, LogOutIcon, SearchIcon, SettingsIcon } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'

import type { AppShellLayoutProps } from '../data'

const NAV_LINK =
  'font-semibold no-underline hover:no-underline data-[status=active]:bg-primary data-[status=active]:text-primary-foreground data-[status=active]:hover:bg-primary/90 data-[status=active]:hover:text-primary-foreground'

export function AppShell({
  homeTo,
  user,
  loading,
  nav,
  navLabel,
  search,
  searchPlaceholder,
  onSearchChange,
  signingOut,
  onSignOut,
}: AppShellLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-17 items-center gap-4 border-b bg-card px-3 sm:px-7">
        <Link to={homeTo} className="flex shrink-0 items-center gap-2.5 no-underline hover:no-underline lg:w-51">
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

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Abrir menu do usuário"
              className="flex shrink-0 items-center gap-2.5 rounded-full p-1 pr-2 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar className="size-9.5">
                <AvatarImage src={user.image} alt="" />
                <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">{user.initials}</AvatarFallback>
              </Avatar>
              <span className="hidden flex-col leading-tight lg:flex">
                <span className="text-sm font-semibold">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.roleLabel}</span>
              </span>
              <ChevronDownIcon className="size-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-72 rounded-2xl p-2">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="flex items-center gap-3 p-2 text-foreground">
                  <Avatar className="size-11">
                    <AvatarImage src={user.image} alt="" />
                    <AvatarFallback className="bg-accent text-sm font-semibold text-accent-foreground">{user.initials}</AvatarFallback>
                  </Avatar>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-sm font-semibold">{user.name}</span>
                    <span className="truncate text-[13px] font-normal text-muted-foreground">{user.email}</span>
                  </span>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="my-1.5" />
              <DropdownMenuItem disabled={signingOut} onClick={onSignOut} className="h-10 gap-2.5 rounded-xl px-2.5 font-semibold">
                <LogOutIcon />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          !loading && (
            <div className="flex shrink-0 items-center gap-2">
              <Button nativeButton={false} render={<Link to="/entrar" />} variant="ghost" className="h-9 rounded-full px-3.5">
                Entrar
              </Button>
              <Button nativeButton={false} render={<Link to="/cadastro" />} className="hidden h-9 rounded-full px-4 sm:inline-flex">
                Criar conta
              </Button>
            </div>
          )
        )}
      </header>

      <div className="flex min-h-0 flex-1">
        <nav aria-label="Menu principal" className="sticky top-17 hidden h-[calc(100dvh-4.25rem)] w-58 shrink-0 flex-col gap-1 self-start overflow-y-auto border-r bg-card px-3.5 py-5 lg:flex">
          <span className="px-3 pb-2 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">{navLabel}</span>
          {nav.map((item) => (
            <Button
              key={item.to}
              variant="ghost"
              nativeButton={false}
              render={<Link to={item.to} activeOptions={{ exact: item.to === '/admin' }} />}
              className={`${NAV_LINK} h-11 justify-start gap-3 rounded-xl px-3`}
            >
              <item.icon className="size-4.5" />
              {item.label}
            </Button>
          ))}
          {user && (
            <div className="mt-auto border-t pt-3">
              <Button
                variant="ghost"
                nativeButton={false}
                render={<Link to="/configuracoes" />}
                className={`${NAV_LINK} h-11 w-full justify-start gap-3 rounded-xl px-3`}
              >
                <SettingsIcon className="size-4.5" />
                Configurações
              </Button>
            </div>
          )}
        </nav>

        <main className="min-w-0 flex-1 bg-[oklch(0.985_0.002_40)] px-3.5 pt-4 pb-20 sm:px-10 sm:pt-9 dark:bg-background">
          {nav.length > 1 && (
            <div className="mb-5 flex flex-wrap gap-2 lg:hidden">
              {nav.map((item) => (
                <Button
                  key={item.to}
                  variant="outline"
                  nativeButton={false}
                  render={<Link to={item.to} activeOptions={{ exact: item.to === '/admin' }} />}
                  className={`${NAV_LINK} h-9.5 rounded-full px-4`}
                >
                  {item.label}
                </Button>
              ))}
              {user && (
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={<Link to="/configuracoes" />}
                  className={`${NAV_LINK} h-9.5 rounded-full px-4`}
                >
                  Configurações
                </Button>
              )}
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  )
}
