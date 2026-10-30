import { createFileRoute, Outlet } from '@tanstack/react-router'

import { requireAuth } from '@/lib/auth/guards'

export const Route = createFileRoute('/_comunidade/_autenticado')({
  beforeLoad: requireAuth,
  component: Outlet,
})
