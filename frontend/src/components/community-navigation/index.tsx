import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import {
  CalendarDaysIcon,
  HouseIcon,
  ListChecksIcon,
  MapPinIcon,
  MessageCircleIcon,
  Settings2Icon,
  UsersRoundIcon,
} from 'lucide-react'

type CommunitySection = 'pautas' | 'discussoes' | 'agenda' | 'distritos'

interface CommunityNavigationProps {
  active: CommunitySection
  children: ReactNode
}

const linkClass =
  'flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium no-underline transition-colors'

export function CommunityNavigation({ active, children }: CommunityNavigationProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col md:flex-row">
      <aside className="border-b bg-background md:w-52 md:shrink-0 md:border-r md:border-b-0">
        <nav
          aria-label="Menu principal"
          className="flex gap-1 overflow-x-auto p-3 md:sticky md:top-16 md:flex-col md:overflow-visible md:px-3 md:py-6"
        >
          <Link to="/painel" className={`${linkClass} text-muted-foreground hover:bg-muted hover:text-foreground`}>
            <HouseIcon className="size-4" />
            Início
          </Link>
          <Link
            to="/pautas"
            aria-current={active === 'pautas' ? 'page' : undefined}
            className={`${linkClass} ${active === 'pautas' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            <ListChecksIcon className="size-4" />
            Pautas
          </Link>
          <Link
            to="/discussoes"
            aria-current={active === 'discussoes' ? 'page' : undefined}
            className={`${linkClass} ${active === 'discussoes' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            <MessageCircleIcon className="size-4" />
            Discussões
          </Link>
          <Link
            to="/agenda"
            aria-current={active === 'agenda' ? 'page' : undefined}
            className={`${linkClass} ${active === 'agenda' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            <CalendarDaysIcon className="size-4" />
            Agenda
          </Link>
          <Link
            to="/minha-participacao"
            search={{ from: 'pautas' }}
            className={`${linkClass} text-muted-foreground hover:bg-muted hover:text-foreground`}
          >
            <UsersRoundIcon className="size-4" />
            Minha participação
          </Link>
          <Link
            to="/distritos"
            aria-current={active === 'distritos' ? 'page' : undefined}
            className={`${linkClass} ${active === 'distritos' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            <MapPinIcon className="size-4" />
            Distritos
          </Link>
          <Link to="/configuracoes" className={`${linkClass} text-muted-foreground hover:bg-muted hover:text-foreground`}>
            <Settings2Icon className="size-4" />
            Configurações
          </Link>
        </nav>
      </aside>
      <main className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </main>
    </div>
  )
}
