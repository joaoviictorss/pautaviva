import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { requireAdmin } from '@/lib/auth/guards'
import { AdminUsuarios } from '@/pages/admin-usuarios'

export const Route = createFileRoute('/_autenticado/admin/usuarios')({
  validateSearch: z.object({ q: z.string().optional() }),
  beforeLoad: requireAdmin,
  component: AdminUsuarios,
})
