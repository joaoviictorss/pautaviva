import { getRouteApi, useLocation, useNavigate } from '@tanstack/react-router'
import { ListChecksIcon, UsersIcon } from 'lucide-react'

import { roleLabel } from '@/lib/auth/roles'
import { getInitials } from '@/lib/utils/format'

import { Admin as Layout } from './layout'
import type { AdminLayoutProps, AdminNavItem, AdminProps } from './data'

const route = getRouteApi('/_autenticado')

const POLLS_NAV: AdminNavItem = { to: '/admin/pautas', label: 'Pautas', icon: ListChecksIcon }
const USERS_NAV: AdminNavItem = { to: '/admin/usuarios', label: 'Usuários', icon: UsersIcon }

export function Admin(_props: AdminProps) {
  const { session } = route.useRouteContext()
  const { user } = session
  const navigate = useNavigate()
  const location = useLocation()
  const search = (location.search as { q?: string }).q ?? ''
  const onUsers = location.pathname.startsWith(USERS_NAV.to)

  // A busca fica na URL (?q=) para valer na tela aberta e sobreviver ao recarregar.
  function handleSearchChange(value: string) {
    navigate({ to: onUsers ? USERS_NAV.to : POLLS_NAV.to, search: { q: value || undefined }, replace: true })
  }

  const layoutProps: AdminLayoutProps = {
    name: user.name,
    initials: getInitials(user.name),
    image: user.image ?? undefined,
    roleLabel: roleLabel(user.role),
    nav: user.role === 'ADMIN' ? [POLLS_NAV, USERS_NAV] : [POLLS_NAV],
    search,
    searchPlaceholder: onUsers ? 'Buscar por nome ou e-mail…' : 'Buscar pautas ou categorias…',
    onSearchChange: handleSearchChange,
  }

  return <Layout {...layoutProps} />
}
