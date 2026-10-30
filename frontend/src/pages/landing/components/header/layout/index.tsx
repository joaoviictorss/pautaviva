import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'

import type { HeaderLayoutProps } from '../data'

export function Header({ navLinks }: HeaderLayoutProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <nav className="flex w-full items-center justify-between gap-6 px-3.5 py-3 sm:px-7">
        <a href="#" className="flex items-center gap-2.5 text-inherit no-underline">
          <img src="/logo-mark.svg" alt="" className="block size-8" />
          <span className="text-lg font-bold tracking-tight text-primary">PautaViva</span>
        </a>

        <div className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground no-underline hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button nativeButton={false} render={<Link to="/entrar" />} variant="ghost" className="h-9 rounded-full px-3.5">
            Entrar
          </Button>
          <Button nativeButton={false} render={<Link to="/cadastro" />} className="h-9 rounded-full px-4">
            Criar conta
          </Button>
        </div>
      </nav>
    </header>
  )
}
