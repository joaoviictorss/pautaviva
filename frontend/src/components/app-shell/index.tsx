import { useLocation, useNavigate } from '@tanstack/react-router'
import {
  CalendarDaysIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  MessageCircleIcon,
  ShieldCheckIcon,
  UsersIcon,
  VoteIcon,
} from 'lucide-react'

import { useSignOut } from '@/hooks/use-sign-out'
import { useSession } from '@/lib/auth/client'
import { STAFF_ROLES } from '@/lib/auth/guards'
import { roleLabel } from '@/lib/auth/roles'
import { getDefaultAvatar } from '@/lib/utils/avatar'
import { getInitials } from '@/lib/utils/format'

import { AppShell as Layout } from './layout'
import type { AppShellLayoutProps, AppShellNavItem, AppShellProps } from './data'

const HOME_NAV: AppShellNavItem = { to: '/admin', label: 'Início', icon: LayoutDashboardIcon }
const POLLS_NAV: AppShellNavItem = { to: '/admin/pautas', label: 'Pautas', icon: ListChecksIcon }
const USERS_NAV: AppShellNavItem = { to: '/admin/usuarios', label: 'Usuários', icon: UsersIcon }
const MODERATION_NAV: AppShellNavItem = { to: '/admin/moderacao', label: 'Moderação', icon: ShieldCheckIcon }

const PUBLIC_POLLS_NAV: AppShellNavItem = { to: '/pautas', label: 'Pautas', icon: ListChecksIcon }
const AGENDA_NAV: AppShellNavItem = { to: '/agenda', label: 'Agenda', icon: CalendarDaysIcon }

const PUBLIC_NAV: AppShellNavItem[] = [
  PUBLIC_POLLS_NAV,
  { to: '/discussoes', label: 'Discussões', icon: MessageCircleIcon },
  AGENDA_NAV,
]
const CITIZEN_NAV: AppShellNavItem[] = [
  { to: '/painel', label: 'Início', icon: LayoutDashboardIcon },
  PUBLIC_POLLS_NAV,
  AGENDA_NAV,
  { to: '/minha-participacao', label: 'Minhas participações', icon: VoteIcon },
]

function getNav(role?: string | null) {
  if (role === 'MANAGER') return [HOME_NAV, POLLS_NAV]
  if (role && STAFF_ROLES.includes(role)) return [HOME_NAV, POLLS_NAV, USERS_NAV, MODERATION_NAV]
  return role ? CITIZEN_NAV : PUBLIC_NAV
}

export function AppShell(_props: AppShellProps) {
  const { data, isPending } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const { signingOut, handleSignOut } = useSignOut()
  const user = data?.user
  const role = user && (user.role ?? 'CITIZEN')
  const staff = !!role && STAFF_ROLES.includes(role)
  const onUsers = location.pathname.startsWith(USERS_NAV.to)
  const onModeration = location.pathname.startsWith(MODERATION_NAV.to)

  // A busca fica na URL (?q=) para valer na tela aberta e sobreviver ao recarregar.
  function handleSearchChange(value: string) {
    const q = value || undefined
    if (staff) navigate({ to: onUsers ? USERS_NAV.to : onModeration ? MODERATION_NAV.to : POLLS_NAV.to, search: { q }, replace: true })
    else navigate({ to: '/pautas', search: (current) => ({ ...current, q, page: undefined }), replace: true })
  }

  const layoutProps: AppShellLayoutProps = {
    homeTo: staff ? '/admin' : user ? '/painel' : '/',
    user: user && {
      name: user.name,
      email: user.email,
      initials: getInitials(user.name),
      image: user.image ?? getDefaultAvatar(user.name),
      roleLabel: roleLabel(user.role),
    },
    loading: isPending,
    nav: getNav(role),
    navLabel: role === 'CITIZEN' ? 'Minha área' : 'Painel',
    search: (location.search as { q?: string }).q ?? '',
    searchPlaceholder: onUsers
      ? 'Buscar por nome ou e-mail…'
      : onModeration
        ? 'Buscar comentários ou autores…'
        : 'Buscar pautas ou categorias…',
    onSearchChange: handleSearchChange,
    signingOut,
    onSignOut: handleSignOut,
  }

  return <Layout {...layoutProps} />
}
