import { createFileRoute } from '@tanstack/react-router'

import { requireStaff } from '@/lib/auth/guards'
import { AppShell } from '@/components/app-shell'

export const Route = createFileRoute('/_autenticado/admin')({
  beforeLoad: requireStaff,
  component: AppShell,
})
