import { useCallback, useEffect, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'

import { toast } from '@/components/ui/toast'
import { api } from '@/lib/api/client'
import { ROLE_LABELS, type Role } from '@/lib/auth/roles'
import { getDefaultAvatar } from '@/lib/utils/avatar'
import { getInitials } from '@/lib/utils/format'

import { AdminUsuarios as Layout } from './layout'
import type {
  AdminRoleOption,
  AdminUsersPage,
  AdminUsuariosLayoutProps,
  AdminUsuariosProps,
  RoleFilter,
} from './data'

const authRoute = getRouteApi('/_autenticado')
const route = getRouteApi('/_autenticado/admin/usuarios')

const ROLE_OPTIONS: AdminRoleOption[] = Object.entries(ROLE_LABELS).map(([value, label]) => ({
  value: value as Role,
  label,
}))

const ROLE_FILTERS: [RoleFilter, string][] = [
  ['ALL', 'Todos'],
  ['CITIZEN', 'Cidadãos'],
  ['MANAGER', 'Gestores'],
  ['MODERATOR', 'Moderadores'],
  ['ADMIN', 'Administradores'],
]

export function AdminUsuarios(_props: AdminUsuariosProps) {
  const { session } = authRoute.useRouteContext()
  const { q = '' } = route.useSearch()
  const [query, setQuery] = useState(q.trim())
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<AdminUsersPage>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [updatingId, setUpdatingId] = useState<string>()

  useEffect(() => {
    const timeout = setTimeout(() => {
      setQuery(q.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timeout)
  }, [q])

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        ...(query && { search: query }),
        ...(roleFilter !== 'ALL' && { role: roleFilter }),
      })
      setData(await api<AdminUsersPage>(`/admin/users?${params}`))
      setError(undefined)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [page, query, roleFilter])

  useEffect(() => {
    load()
  }, [load])

  async function handleRoleChange(userId: string, role: Role) {
    setUpdatingId(userId)
    try {
      await api(`/admin/users/${userId}/role`, { method: 'PATCH', json: { role } })
      const name = data?.users.find((user) => user.id === userId)?.name
      toast.add({
        type: 'success',
        title: 'Perfil alterado',
        description: `${name} agora é ${ROLE_LABELS[role].toLowerCase()}. Registrado na auditoria.`,
      })
      await load()
    } catch (err) {
      toast.add({ type: 'error', title: 'Não foi possível alterar o perfil', description: (err as Error).message })
    } finally {
      setUpdatingId(undefined)
    }
  }

  const counts = data?.countsByRole ?? {}
  const allCount = Object.values(counts).reduce((sum, count) => sum + (count ?? 0), 0)

  const layoutProps: AdminUsuariosLayoutProps = {
    canManage: session.user.role === 'ADMIN',
    filters: ROLE_FILTERS.map(([value, label]) => ({
      value,
      label,
      count: value === 'ALL' ? allCount : (counts[value] ?? 0),
    })),
    roleFilter,
    onRoleFilterChange: (value) => {
      setRoleFilter(value)
      setPage(1)
    },
    rows: (data?.users ?? []).map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image ?? getDefaultAvatar(user.name),
      initials: getInitials(user.name),
      role: user.role,
      isSelf: user.id === session.user.id,
      pending: user.pending,
      createdLabel: new Date(user.createdAt).toLocaleDateString('pt-BR'),
      updating: updatingId === user.id,
    })),
    loading,
    error,
    roleOptions: ROLE_OPTIONS,
    onRoleChange: handleRoleChange,
    onUserCreated: load,
    page,
    totalPages: data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1,
    total: data?.total ?? 0,
    onPageChange: setPage,
  }

  return <Layout {...layoutProps} />
}
