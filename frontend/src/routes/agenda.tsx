import { createFileRoute } from '@tanstack/react-router'

import { Agenda } from '@/pages/agenda'

export const Route = createFileRoute('/agenda')({
  component: Agenda,
})
