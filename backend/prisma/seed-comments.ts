// Um cidadão com 200 comentários, 100 publicados e 100 reprovados: `npm run db:seed:comments`.
// Rode depois do seed de demonstração. Pode rodar de novo: recria só esse cidadão e os comentários dele.
// O status vem deste script, sem passar pela triagem automática: isto é dado de demonstração, não medição da IA.
import { prisma } from '../src/lib/prisma.js'
import { NORMAL_COMMENTS, OFFENSIVE_COMMENTS } from './demo-comments.js'

const AUTHOR_EMAIL = 'comentarista@demo.pautaviva.test'
const PASSWORD_SOURCE_EMAIL = 'cidadao1@demo.pautaviva.test'
const REJECTION_REASON = 'Comentário ofensivo.'
const POLL_TITLES = [
  'Wi-Fi gratuito nas praças',
  'Castração gratuita de animais',
  'Reajuste do estacionamento rotativo',
  'Academias ao ar livre nos bairros',
  'Reforço escolar no contraturno',
  'Revitalização do Parque das Águas',
  'Guarda municipal no Terminal Central',
]

function abort(message: string): never {
  console.error(`❌ ${message}`)
  process.exit(1)
}

if (OFFENSIVE_COMMENTS.length !== 100 || NORMAL_COMMENTS.length !== 100) abort('A lista precisa ter 100 frases de cada tipo.')

const polls = await prisma.polls.findMany({
  where: { title: { in: POLL_TITLES } },
  select: { id: true, startsAt: true, endsAt: true },
  orderBy: { title: 'asc' },
})
if (polls.length !== POLL_TITLES.length) abort('Pautas novas não encontradas: rode `npm run db:seed:demo` antes.')

// copia o hash em vez de receber a senha: a conta entra com a mesma senha das outras contas demo
const passwordSource = await prisma.accounts.findFirst({
  where: { providerId: 'credential', users: { email: PASSWORD_SOURCE_EMAIL } },
  select: { password: true },
})
if (!passwordSource?.password) abort('Contas demo não encontradas: rode `npm run db:seed:demo` antes.')

await prisma.users.deleteMany({ where: { email: AUTHOR_EMAIL } })

const authorId = crypto.randomUUID()
await prisma.users.create({
  data: {
    id: authorId,
    name: 'Clara Comentarista',
    email: AUTHOR_EMAIL,
    role: 'CITIZEN',
    emailVerified: true,
    accounts: {
      create: { id: crypto.randomUUID(), accountId: authorId, providerId: 'credential', password: passwordSource.password },
    },
  },
})

const now = Date.now()
const rows = [
  ...NORMAL_COMMENTS.map((text) => ({ text, status: 'APPROVED' as const, classification: 'ADEQUATE' as const })),
  ...OFFENSIVE_COMMENTS.map((text) => ({
    text,
    status: 'REJECTED' as const,
    classification: 'INAPPROPRIATE' as const,
    moderationReason: REJECTION_REASON,
  })),
]

await prisma.comments.createMany({
  data: rows.map((row, index) => {
    const poll = polls[index % polls.length]
    const lastMoment = Math.min(poll.endsAt.getTime(), now)
    const createdAt = new Date(poll.startsAt.getTime() + (lastMoment - poll.startsAt.getTime()) * ((index + 1) / (rows.length + 1)))
    return { ...row, pollId: poll.id, authorId, createdAt, updatedAt: createdAt }
  }),
})

const [approved, rejected] = await Promise.all(
  (['APPROVED', 'REJECTED'] as const).map((status) => prisma.comments.count({ where: { authorId, status } })),
)
if (approved !== 100 || rejected !== 100) abort(`Esperado 100 a 100, ficou ${approved} a ${rejected}.`)

console.log(`✅ ${AUTHOR_EMAIL}: ${approved} comentários publicados e ${rejected} reprovados.`)
await prisma.$disconnect()
