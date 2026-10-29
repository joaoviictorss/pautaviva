import { createFileRoute } from '@tanstack/react-router'

import { Pautas } from '@/pages/pautas'

export const Route = createFileRoute('/pautas/')({
  component: Pautas,
})
