import { getRouteApi, useLocation, useNavigate } from '@tanstack/react-router'
import { LayoutDashboardIcon, ListChecksIcon, ShieldCheckIcon, UsersIcon } from 'lucide-react'

import { useSignOut } from '@/hooks/use-sign-out'
import { roleLabel } from '@/lib/auth/roles'
import { getDefaultAvatar } from '@/lib/utils/avatar'
import { getInitials } from '@/lib/utils/format'

import { Admin as Layout } from './layout'
import type { AdminLayoutProps, AdminNavItem, AdminProps } from './data'

const route = getRouteApi('/_autenticado')

const HOME_NAV: AdminNavItem = { to: '/admin', label: 'Início', icon: LayoutDashboardIcon }
const POLLS_NAV: AdminNavItem = { to: '/admin/pautas', label: 'Pautas', icon: ListChecksIcon }
const USERS_NAV: AdminNavItem = { to: '/admin/usuarios', label: 'Usuários', icon: UsersIcon }
const MODERATION_NAV: AdminNavItem = { to: '/admin/moderacao', label: 'Moderação', icon: ShieldCheckIcon }

export function Admin(_props: AdminProps) {
  const { session } = route.useRouteContext()
  const { user } = session
  const navigate = useNavigate()
  const location = useLocation()
  const { signingOut, handleSignOut } = useSignOut()
  const search = (location.search as { q?: string }).q ?? ''
  const onUsers = location.pathname.startsWith(USERS_NAV.to)
  const onModeration = location.pathname.startsWith(MODERATION_NAV.to)

  // A busca fica na URL (?q=) para valer na tela aberta e sobreviver ao recarregar.
  function handleSearchChange(value: string) {
    navigate({ to: onUsers ? USERS_NAV.to : onModeration ? MODERATION_NAV.to : POLLS_NAV.to, search: { q: value || undefined }, replace: true })
  }

  const layoutProps: AdminLayoutProps = {
    name: user.name,
    email: user.email,
    initials: getInitials(user.name),
    image: user.image ?? getDefaultAvatar(user.name),
    roleLabel: roleLabel(user.role),
    nav: user.role === 'MANAGER' ? [HOME_NAV, POLLS_NAV] : [HOME_NAV, POLLS_NAV, USERS_NAV, MODERATION_NAV],
    search,
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
