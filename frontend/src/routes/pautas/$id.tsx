import { createFileRoute } from '@tanstack/react-router'

import { Pauta } from '@/pages/pauta'

export const Route = createFileRoute('/pautas/$id')({
  component: Pauta,
})
