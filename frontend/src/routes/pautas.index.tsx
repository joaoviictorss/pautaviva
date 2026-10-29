import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { Pautas } from '@/pages/pautas'

export const Route = createFileRoute('/pautas/')({
  validateSearch: z.object({
    categoryId: z.string().optional(),
    search: z.string().optional(),
    status: z.enum(['ALL', 'SCHEDULED', 'OPEN', 'CLOSED']).optional(),
    sort: z.enum(['recent', 'start', 'ending']).optional(),
    page: z.coerce.number().int().positive().optional(),
  }),
  component: Pautas,
})
