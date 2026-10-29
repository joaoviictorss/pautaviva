import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { Entrar } from '@/pages/entrar'

export const Route = createFileRoute('/_visitante/entrar')({
  // só caminhos internos: "//site" ou "/\site" virariam redirecionamento para fora (open redirect)
  validateSearch: z.object({ redirect: z.string().regex(/^\/(?![/\\])/).optional().catch(undefined) }),
  component: Entrar,
})
