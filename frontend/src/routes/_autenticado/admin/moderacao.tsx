import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { requireModerator } from '@/lib/auth/guards'
import { Moderacao } from '@/pages/moderacao'

export const Route = createFileRoute('/_autenticado/admin/moderacao')({
  validateSearch: z.object({ q: z.string().optional(), pauta: z.string().optional() }),
  beforeLoad: requireModerator,
  component: Moderacao,
})
