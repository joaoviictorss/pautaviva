import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { Pautas } from '@/pages/pautas'

export const Route = createFileRoute('/_comunidade/pautas/')({
  validateSearch: z.object({
    categoryId: z.string().optional(),
    q: z.string().optional(),
    status: z.enum(['SCHEDULED', 'OPEN', 'CLOSED']).optional().catch(undefined),
    missing: z.boolean().optional(),
    page: z.coerce.number().int().positive().optional(),
  }),
  component: Pautas,
})
