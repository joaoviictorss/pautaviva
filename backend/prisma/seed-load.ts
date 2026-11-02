// Massa do teste de carga (load/vote.js): `npm run db:seed:load`, só no banco local.
// Pode rodar de novo: apaga só o que o próprio seed criou, zerando a pauta para a próxima execução.
import { hashPassword } from 'better-auth/crypto'

import { env } from '../src/env.js'
import { prisma } from '../src/lib/prisma.js'

const LOAD_DOMAIN = 'carga.pautaviva.test'
const LOAD_PASSWORD = 'carga1234'
const LOAD_POLL_TITLE = 'Pauta do teste de carga'
// cada conta vota uma vez: 500 VUs por 7 min, com cerca de 55 s por iteração, iniciam umas 3.800 iterações
const CITIZEN_COUNT = 4000
const LOCAL_DATABASE_HOSTS = ['localhost', '127.0.0.1', 'postgres']
const HOUR_MS = 60 * 60 * 1000

if (!LOCAL_DATABASE_HOSTS.includes(new URL(env.DATABASE_URL).hostname)) {
  console.error('❌ O seed de carga só roda no banco local.')
  process.exit(1)
}

const category = await prisma.categories.findFirst({ select: { id: true } })
if (!category) {
  console.error('❌ Nenhuma categoria cadastrada: rode `npm run db:seed` antes.')
  process.exit(1)
}

const domainFilter = { email: { endsWith: `@${LOAD_DOMAIN}` } }
await prisma.polls.deleteMany({ where: { createdBy: domainFilter } })
await prisma.users.deleteMany({ where: domainFilter })

const manager = { id: crypto.randomUUID(), name: 'Gestor da Carga', email: `gestor@${LOAD_DOMAIN}`, role: 'MANAGER' as const, emailVerified: true }
const citizens = Array.from({ length: CITIZEN_COUNT }, (_, index) => ({
  id: crypto.randomUUID(),
  name: `Cidadão Carga ${index + 1}`,
  email: `cidadao${index + 1}@${LOAD_DOMAIN}`,
  role: 'CITIZEN' as const,
  emailVerified: true,
}))
const users = [manager, ...citizens]
const password = await hashPassword(LOAD_PASSWORD)

await prisma.users.createMany({ data: users })
await prisma.accounts.createMany({
  data: users.map((user) => ({
    id: crypto.randomUUID(),
    accountId: user.id,
    providerId: 'credential',
    userId: user.id,
    password,
  })),
})

const now = Date.now()
await prisma.polls.create({
  data: {
    title: LOAD_POLL_TITLE,
    description: 'Pauta criada pelo seed de carga para receber os votos do script do k6.',
    startsAt: new Date(now - HOUR_MS),
    endsAt: new Date(now + 24 * HOUR_MS),
    status: 'OPEN',
    categoryId: category.id,
    createdById: manager.id,
  },
})

console.log(`✅ ${CITIZEN_COUNT} cidadãos em @${LOAD_DOMAIN} e a pauta "${LOAD_POLL_TITLE}".`)
await prisma.$disconnect()
