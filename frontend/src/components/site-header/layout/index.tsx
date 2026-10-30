import { Link } from '@tanstack/react-router'
import { ChevronDownIcon, Settings2Icon, ShieldCheckIcon } from 'lucide-react'

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
import { getInitials } from '@/lib/utils/format'

import type { SiteHeaderLayoutProps } from '../data'

export function SiteHeader({ loading, signedIn, user }: SiteHeaderLayoutProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <nav className="flex h-16 w-full items-center justify-between gap-4 px-3.5 sm:px-7">
        <Link to="/" className="flex items-center gap-2.5 text-inherit no-underline hover:no-underline">
          <img src="/logo-mark.svg" alt="" className="block size-8" />
          <span className="text-lg font-bold tracking-tight text-primary">PautaViva</span>
        </Link>

        {!loading && (
          <div className="flex items-center gap-2">
            {signedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Abrir menu do usuário"
                  className="flex items-center gap-2 rounded-full p-1 pr-2 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Avatar className="size-9">
                    {user?.image && <AvatarImage src={user.image} alt="" />}
                    <AvatarFallback>{getInitials(user?.name ?? '')}</AvatarFallback>
                  </Avatar>
                  <ChevronDownIcon className="size-4 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-52">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="flex flex-col gap-1">
                      <span>{user?.name}</span>
                      <span className="font-normal text-muted-foreground">{user?.email}</span>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem render={<Link to="/configuracoes" />}>
                    <Settings2Icon />
                    Configurações
                  </DropdownMenuItem>
                  {['MODERATOR', 'ADMIN'].includes(user?.role ?? '') && (
                    <DropdownMenuItem render={<Link to="/moderacao" />}>
                      <ShieldCheckIcon />
                      Moderação
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button nativeButton={false} render={<Link to="/entrar" />} variant="ghost" className="h-9 rounded-full px-3.5">
                  Entrar
                </Button>
                <Button nativeButton={false} render={<Link to="/cadastro" />} className="h-9 rounded-full px-4">
                  Criar conta
                </Button>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  )
}
