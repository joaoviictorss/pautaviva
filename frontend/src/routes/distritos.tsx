import { createFileRoute } from '@tanstack/react-router'

import { Distritos } from '@/pages/distritos'

export const Route = createFileRoute('/distritos')({
  component: Distritos,
})
