import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url().default('http://localhost:3333'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  // Atrás de proxy reverso o IP real vem no X-Forwarded-For.
  // Só ligue quando houver proxy na frente, senão o cliente forja o próprio IP.
  TRUST_PROXY: z.stringbool().default(false),
  // Sem SMTP_HOST, os e-mails são só registrados no log (útil em desenvolvimento).
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  // Padrão: o próprio SMTP_USER como remetente.
  MAIL_FROM: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', z.treeifyError(parsed.error))
  throw new Error('Invalid environment variables.')
}

export const env = parsed.data
