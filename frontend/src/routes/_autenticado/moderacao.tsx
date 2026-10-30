import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_autenticado/moderacao')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/moderacao' })
  },
})
