import { hashPassword } from 'better-auth/crypto'
import { z } from 'zod'

import { prisma } from '../src/lib/prisma.js'

const CATEGORIES = [
  'Meio Ambiente',
  'Mobilidade',
  'Educação',
  'Saúde',
  'Segurança',
  'Infraestrutura',
  'Economia',
  'Cultura',
  'Urbanismo',
]

await prisma.categories.createMany({ data: CATEGORIES.map((name) => ({ name })), skipDuplicates: true })

const env = z
  .object({
    ROOT_ADMIN_NAME: z.string().trim().min(3),
    ROOT_ADMIN_EMAIL: z.string().trim().toLowerCase().pipe(z.email()),
    ROOT_ADMIN_PASSWORD: z.string().min(8).max(128),
  })
  .safeParse(process.env)

if (!env.success) {
  console.warn('⚠️  Usuário root não criado: defina ROOT_ADMIN_NAME, ROOT_ADMIN_EMAIL e ROOT_ADMIN_PASSWORD (mín. 8 caracteres) no backend/.env.')
  await prisma.$disconnect()
  process.exit(0)
}

const { ROOT_ADMIN_NAME: name, ROOT_ADMIN_EMAIL: email, ROOT_ADMIN_PASSWORD: password } = env.data

// Se a conta já existe, só garante o perfil de admin: rodar o seed de novo não troca a senha de ninguém.
const user = await prisma.users.upsert({
  where: { email },
  update: { role: 'ADMIN' },
  create: { id: crypto.randomUUID(), name, email, emailVerified: true, role: 'ADMIN' },
})

const credential = await prisma.accounts.findFirst({ where: { userId: user.id, providerId: 'credential' } })
if (!credential) {
  await prisma.accounts.create({
    data: {
      id: crypto.randomUUID(),
      accountId: user.id,
      providerId: 'credential',
      userId: user.id,
      password: await hashPassword(password),
    },
  })
}

console.log(`✅ ${email} é administrador${credential ? ' (senha existente mantida)' : ''}.`)
await prisma.$disconnect()
