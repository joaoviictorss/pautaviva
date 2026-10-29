import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'

import type { SiteHeaderLayoutProps } from '../data'

export function SiteHeader({ loading, signedIn }: SiteHeaderLayoutProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 text-inherit no-underline hover:no-underline">
          <img src="/logo-mark.svg" alt="" className="block size-8" />
          <span className="text-lg font-bold tracking-tight text-primary">PautaViva</span>
        </Link>

        {!loading && (
          <div className="flex items-center gap-2">
            {signedIn ? (
              <Button render={<Link to="/painel" />} variant="outline" className="h-9 rounded-full px-4">
                Meu painel
              </Button>
            ) : (
              <>
                <Button render={<Link to="/entrar" />} variant="ghost" className="h-9 rounded-full px-3.5">
                  Entrar
                </Button>
                <Button render={<Link to="/cadastro" />} className="h-9 rounded-full px-4">
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
