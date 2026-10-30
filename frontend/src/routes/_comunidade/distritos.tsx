import { createFileRoute } from '@tanstack/react-router'

import { Distritos } from '@/pages/distritos'

export const Route = createFileRoute('/_comunidade/distritos')({
  component: Distritos,
})
