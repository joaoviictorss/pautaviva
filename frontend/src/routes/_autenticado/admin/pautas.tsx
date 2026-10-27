import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { AdminPautas } from '@/pages/admin-pautas'

export const Route = createFileRoute('/_autenticado/admin/pautas')({
  validateSearch: z.object({ q: z.string().optional() }),
  component: AdminPautas,
})
