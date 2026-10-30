// Dados de demonstração para desenvolvimento: `npm run db:seed:demo`.
// Pode rodar de novo: apaga só o que o próprio seed criou e recria com datas relativas a hoje.
import { hashPassword } from 'better-auth/crypto'
import type { CommentClassification, CommentReportReason, Role, VoteOption } from '@prisma/client'

import { env } from '../src/env.js'
import { prisma } from '../src/lib/prisma.js'
import { hashCpf } from '../src/utils/cpf.js'

const DEMO_DOMAIN = 'demo.pautaviva.test'
const DEMO_PASSWORD = process.env.DEMO_SEED_PASSWORD ?? 'demo1234'
const CITIZEN_COUNT = 150
const LOCAL_DATABASE_HOSTS = ['localhost', '127.0.0.1', 'postgres']
const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

// a senha padrão é pública no repositório: fora do banco local, exige uma senha própria
const remoteDatabase = process.env.NODE_ENV === 'production' || !LOCAL_DATABASE_HOSTS.includes(new URL(env.DATABASE_URL).hostname)
if (remoteDatabase && !process.env.DEMO_SEED_PASSWORD) {
  console.error('❌ Fora do banco local, defina DEMO_SEED_PASSWORD para o seed de demonstração.')
  process.exit(1)
}

const STAFF: { key: string; name: string; role: Role }[] = [
  { key: 'admin', name: 'Lúcia Ramos', role: 'ADMIN' },
  { key: 'gestor', name: 'Paulo Henrique', role: 'MANAGER' },
  { key: 'gestora', name: 'Denise Alves', role: 'MANAGER' },
  { key: 'moderadora', name: 'Marina Souza', role: 'MODERATOR' },
  { key: 'moderador', name: 'Thiago Rocha', role: 'MODERATOR' },
]

const FIRST_NAMES = [
  'Ana', 'Bruno', 'Camila', 'Diego', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João',
  'Karina', 'Lucas', 'Mariana', 'Nicolas', 'Olívia', 'Pedro', 'Rafaela', 'Samuel', 'Tatiane', 'Vinícius',
]
const LAST_NAMES = [
  'Almeida', 'Barbosa', 'Cardoso', 'Dias', 'Esteves', 'Ferreira', 'Gomes', 'Lima', 'Machado', 'Nunes',
  'Oliveira', 'Pereira', 'Queiroz', 'Ribeiro', 'Santos', 'Teixeira', 'Vieira', 'Xavier',
]

interface DemoPoll {
  title: string
  description: string
  category: string
  /** Dias em relação a hoje (negativo é passado). */
  startDay: number
  endDay: number
  /** Percentual a favor, contra e abstenção. */
  lean: [number, number, number]
  turnout: number
  createdBy: 'gestor' | 'gestora'
  comments: string[]
}

const POLLS: DemoPoll[] = [
  // Encerradas
  {
    title: 'Ciclovia na Avenida Central',
    description: 'Implantar 4 km de ciclovia protegida ligando o terminal de ônibus ao parque municipal, com redução de uma faixa de estacionamento.',
    category: 'Mobilidade',
    startDay: -88, endDay: -68, lean: [68, 24, 8], turnout: 0.72, createdBy: 'gestor',
    comments: ['Vou de bicicleta para o trabalho e hoje divido a pista com os ônibus. Seria um avanço enorme.', 'Apoio, mas é preciso prever vagas de carga e descarga para o comércio da avenida.', 'Em outras cidades o movimento no comércio aumentou depois da ciclovia.'],
  },
  {
    title: 'Horário estendido nas bibliotecas públicas',
    description: 'Abrir as três bibliotecas municipais até as 21h nos dias úteis, com remanejamento de equipes e reforço na segurança.',
    category: 'Cultura',
    startDay: -74, endDay: -54, lean: [81, 11, 8], turnout: 0.55, createdBy: 'gestora',
    comments: ['Quem estuda à noite não tem outro lugar silencioso para ir.', 'Ótima ideia. Só falta divulgar melhor o que as bibliotecas oferecem.'],
  },
  {
    title: 'Coleta seletiva porta a porta',
    description: 'Ampliar a coleta seletiva para todos os bairros, duas vezes por semana, com novos pontos de entrega voluntária.',
    category: 'Meio Ambiente',
    startDay: -60, endDay: -40, lean: [86, 9, 5], turnout: 0.8, createdBy: 'gestor',
    comments: ['No meu bairro o caminhão só passa uma vez por mês, e olhe lá.', 'A cooperativa de catadores precisa participar desde o início.', 'Faltam informações claras sobre o que pode ser reciclado.'],
  },
  {
    title: 'Taxa de iluminação pública progressiva',
    description: 'Revisar a contribuição de iluminação pública para que imóveis de maior consumo paguem proporcionalmente mais.',
    category: 'Economia',
    startDay: -46, endDay: -26, lean: [38, 52, 10], turnout: 0.48, createdBy: 'gestora',
    comments: ['Antes de mudar a taxa, quero ver a prestação de contas do que já é arrecadado.', 'Quem consome mais pode pagar mais, parece justo.'],
  },
  {
    title: 'Reforma da Praça do Mercado',
    description: 'Revitalizar a praça com novo piso acessível, iluminação em LED, playground e espaço para feiras de fim de semana.',
    category: 'Urbanismo',
    startDay: -34, endDay: -14, lean: [74, 15, 11], turnout: 0.66, createdBy: 'gestor',
    comments: ['A praça é o coração do bairro e está abandonada há anos.', 'Importante manter as árvores antigas no projeto.', 'As feiras de fim de semana vão ajudar quem produz por aqui.'],
  },
  // Abertas
  {
    title: 'Mais áreas verdes no centro',
    description: 'Criar corredores verdes e plantar 2 mil árvores nas ruas centrais, priorizando escolas e pontos de ônibus.',
    category: 'Meio Ambiente',
    startDay: -21, endDay: 1, lean: [72, 18, 10], turnout: 0.7, createdBy: 'gestor',
    comments: ['As ruas do centro passam dos 40 graus no verão. Sombra é questão de saúde.', 'Precisamos escolher espécies nativas e cuidar da manutenção.', 'Apoio, desde que as calçadas continuem acessíveis.'],
  },
  {
    title: 'Nova linha de ônibus na Zona Leste',
    description: 'Criar uma linha direta entre a Zona Leste e o centro, com intervalos de 15 minutos nos horários de pico.',
    category: 'Mobilidade',
    startDay: -17, endDay: 5, lean: [64, 27, 9], turnout: 0.62, createdBy: 'gestora',
    comments: ['Hoje preciso de duas conduções para chegar ao centro.', 'Com intervalo de 15 minutos muda a vida de quem trabalha cedo.'],
  },
  {
    title: 'Melhorias no atendimento das UBS',
    description: 'Implantar agendamento online e ampliar o horário de atendimento das Unidades Básicas de Saúde até as 20h.',
    category: 'Saúde',
    startDay: -13, endDay: 9, lean: [83, 10, 7], turnout: 0.58, createdBy: 'gestor',
    comments: ['Na UBS do Jardim Alvorada a espera passa de 3 horas.', 'O agendamento precisa ter opção por telefone para quem não usa internet.', 'Atendimento à noite ajudaria muito quem trabalha o dia todo.'],
  },
  {
    title: 'Mais vagas em creches municipais',
    description: 'Construir duas novas creches e firmar convênios para zerar a fila de espera em até dois anos.',
    category: 'Educação',
    startDay: -9, endDay: 13, lean: [90, 6, 4], turnout: 0.46, createdBy: 'gestora',
    comments: ['Moro no bairro há 10 anos e nunca consegui vaga.', 'Convênio só funciona com fiscalização da qualidade.'],
  },
  {
    title: 'Recapeamento de vias no bairro Alvorada',
    description: 'Recuperar 12 km de vias, com drenagem nos pontos de alagamento e nova sinalização.',
    category: 'Infraestrutura',
    startDay: -5, endDay: 17, lean: [77, 14, 9], turnout: 0.34, createdBy: 'gestor',
    comments: ['A Rua das Flores tem buracos enormes desde o início do ano.'],
  },
  {
    title: 'Iluminação nas rotas escolares',
    description: 'Trocar a iluminação das ruas próximas às escolas e instalar câmeras nos trajetos mais usados à noite.',
    category: 'Segurança',
    startDay: -2, endDay: 20, lean: [79, 12, 9], turnout: 0.18, createdBy: 'gestora',
    comments: ['Minha filha volta da escola às 22h e a rua fica às escuras.'],
  },
  {
    title: 'Feira cultural mensal no Parque da Cidade',
    description: 'Realizar uma feira mensal com artistas locais, gastronomia e oficinas gratuitas para a comunidade.',
    category: 'Cultura',
    startDay: 0, endDay: 21, lean: [0, 0, 0], turnout: 0, createdBy: 'gestor',
    comments: [],
  },
  // Agendadas
  {
    title: 'Programa de hortas comunitárias',
    description: 'Ceder terrenos públicos ociosos para hortas mantidas por moradores, com apoio técnico da prefeitura.',
    category: 'Meio Ambiente',
    startDay: 3, endDay: 24, lean: [0, 0, 0], turnout: 0, createdBy: 'gestora',
    comments: [],
  },
  {
    title: 'Faixa exclusiva de ônibus na Rua Sete',
    description: 'Criar faixa exclusiva nos horários de pico para reduzir o tempo de viagem do transporte coletivo.',
    category: 'Mobilidade',
    startDay: 7, endDay: 28, lean: [0, 0, 0], turnout: 0, createdBy: 'gestor',
    comments: [],
  },
  {
    title: 'Incentivo a pequenos negócios locais',
    description: 'Reduzir taxas de alvará no primeiro ano e criar um programa de capacitação para microempreendedores.',
    category: 'Economia',
    startDay: 12, endDay: 33, lean: [0, 0, 0], turnout: 0, createdBy: 'gestora',
    comments: [],
  },
]

const PENDING_COMMENTS: { poll: string; text: string; hours: number; classification: CommentClassification; reason?: string }[] = [
  { poll: 'Mais áreas verdes no centro', text: 'A praça perto da escola precisa de sombra urgente. As crianças ficam no sol no horário de saída.', hours: 31, classification: 'ADEQUATE' },
  { poll: 'Nova linha de ônibus na Zona Leste', text: 'Isso é tudo jogada política, ninguém vai usar essa linha!!!', hours: 27, classification: 'SUSPECT', reason: 'Tom agressivo e generalização sem argumento.' },
  { poll: 'Melhorias no atendimento das UBS', text: 'Sugiro que o agendamento avise por mensagem um dia antes da consulta.', hours: 9, classification: 'ADEQUATE' },
  { poll: 'Mais vagas em creches municipais', text: 'Apoio totalmente, mas quero saber em quais bairros as creches serão construídas.', hours: 4, classification: 'ADEQUATE' },
  { poll: 'Recapeamento de vias no bairro Alvorada', text: 'Esse vereador do bairro é um incompetente e todo mundo sabe disso.', hours: 2, classification: 'SUSPECT', reason: 'Possível ataque pessoal.' },
  { poll: 'Iluminação nas rotas escolares', text: 'Câmeras sim, mas quem vai ter acesso às imagens?', hours: 1, classification: 'ADEQUATE' },
]

const REPORTED_COMMENTS: { poll: string; text: string; reasons: CommentReportReason[]; days: number }[] = [
  { poll: 'Mais áreas verdes no centro', text: 'Compre mudas com desconto no meu site, link na minha bio!', reasons: ['SPAM', 'SPAM', 'OTHER'], days: 3 },
  { poll: 'Nova linha de ônibus na Zona Leste', text: 'Quem mora na Zona Leste sempre reclama de tudo.', reasons: ['OFFENSIVE_CONTENT'], days: 2 },
]

const REJECTED_COMMENTS: { poll: string; text: string; reason: string; days: number }[] = [
  { poll: 'Melhorias no atendimento das UBS', text: 'Liguem para a enfermeira responsável, o telefone dela está na recepção e é 99999-0000.', reason: 'Dados pessoais', days: 4 },
  { poll: 'Mais áreas verdes no centro', text: 'Alguém sabe quando sai o resultado do concurso da prefeitura?', reason: 'Fora do tema', days: 6 },
  { poll: 'Reforma da Praça do Mercado', text: 'Os responsáveis por essa obra são todos uns ladrões.', reason: 'Ofensivo ou discurso de ódio', days: 20 },
]

const REMOVED_COMMENT = {
  poll: 'Ciclovia na Avenida Central',
  text: 'Ciclista tem mais é que ser atropelado mesmo.',
  reason: 'Ofensivo ou discurso de ódio',
}

const DISMISSED_REPORT_COMMENT = {
  poll: 'Coleta seletiva porta a porta',
  text: 'Discordo da forma como a prefeitura conduziu esse tema até agora.',
}

// PRNG com semente: toda execução gera a mesma distribuição
let state = 20261030
function random() {
  state = (state + 0x6d2b79f5) | 0
  let mixed = Math.imul(state ^ (state >>> 15), 1 | state)
  mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed
  return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296
}

const pick = <T,>(items: T[]) => items[Math.floor(random() * items.length)]

function shuffled<T>(items: T[]) {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1))
    ;[copy[index], copy[other]] = [copy[other], copy[index]]
  }
  return copy
}

function validCpf(seed: number) {
  const digits = String(100000000 + seed * 7919).padStart(9, '0').slice(0, 9).split('').map(Number)
  for (const weight of [10, 11]) {
    const sum = digits.reduce((total, digit, index) => total + digit * (weight - index), 0)
    digits.push(((sum * 10) % 11) % 10)
  }
  return digits.join('')
}

async function clearDemoData() {
  const demoUsers = await prisma.users.findMany({ where: { email: { endsWith: `@${DEMO_DOMAIN}` } }, select: { id: true } })
  const userIds = demoUsers.map((user) => user.id)
  const polls = await prisma.polls.findMany({ where: { createdById: { in: userIds } }, select: { id: true } })
  const pollIds = polls.map((poll) => poll.id)
  const comments = await prisma.comments.findMany({
    where: { OR: [{ pollId: { in: pollIds } }, { authorId: { in: userIds } }] },
    select: { id: true },
  })

  await prisma.auditLogs.deleteMany({
    where: {
      OR: [
        { actorId: { in: userIds } },
        { targetId: { in: [...userIds, ...pollIds, ...comments.map((comment) => comment.id)] } },
      ],
    },
  })
  await prisma.polls.deleteMany({ where: { id: { in: pollIds } } })
  await prisma.users.deleteMany({ where: { id: { in: userIds } } })
}

await clearDemoData()

const now = Date.now()
const hoursAgo = (hours: number) => new Date(now - hours * HOUR_MS)
const daysFromNow = (days: number) => new Date(now + days * DAY_MS)

const categories = new Map((await prisma.categories.findMany()).map((category) => [category.name, category.id]))
const password = await hashPassword(DEMO_PASSWORD)

const staff = Object.fromEntries(
  STAFF.map(({ key, name, role }) => [
    key,
    { id: crypto.randomUUID(), name, email: `${key}@${DEMO_DOMAIN}`, role, emailVerified: true, createdAt: daysFromNow(-150) },
  ]),
)

const citizens = Array.from({ length: CITIZEN_COUNT }, (_, index) => ({
  id: crypto.randomUUID(),
  name: `${FIRST_NAMES[index % FIRST_NAMES.length]} ${LAST_NAMES[(index * 7) % LAST_NAMES.length]}`,
  email: `cidadao${index + 1}@${DEMO_DOMAIN}`,
  role: 'CITIZEN' as const,
  emailVerified: true,
  cpf: hashCpf(validCpf(index + 1), env.BETTER_AUTH_SECRET),
  createdAt: daysFromNow(-140 + index * 0.5),
}))

const users = [...Object.values(staff), ...citizens]
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

const moderators = [staff.moderadora, staff.moderador, staff.admin]
const pollIds = new Map<string, string>()
const participants = new Map<string, typeof citizens>()
const participationRows: { pollId: string; userId: string; createdAt: Date }[] = []
const voteRows: { pollId: string; option: VoteOption }[] = []
const auditRows: {
  action: string
  actorId?: string
  targetId: string
  createdAt: Date
  details?: { endsAt?: string; action?: string; reason?: string }
}[] = []
const commentRows: {
  id: string
  text: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REMOVED'
  classification: CommentClassification
  moderationReason?: string
  pollId: string
  authorId: string
  moderatedById?: string
  createdAt: Date
  updatedAt: Date
}[] = []

for (const poll of POLLS) {
  const id = crypto.randomUUID()
  const startsAt = poll.startDay === 0 ? hoursAgo(2) : daysFromNow(poll.startDay)
  const endsAt = daysFromNow(poll.endDay)
  const closed = endsAt.getTime() <= now
  const scheduled = startsAt.getTime() > now
  const createdAt = scheduled ? hoursAgo(30 + poll.startDay * 3) : new Date(startsAt.getTime() - 5 * DAY_MS)

  pollIds.set(poll.title, id)
  await prisma.polls.create({
    data: {
      id,
      title: poll.title,
      description: poll.description,
      startsAt,
      endsAt,
      status: closed ? 'CLOSED' : scheduled ? 'SCHEDULED' : 'OPEN',
      categoryId: categories.get(poll.category) ?? '',
      createdById: staff[poll.createdBy].id,
      createdAt,
    },
  })

  auditRows.push({ action: 'POLL_CREATED', actorId: staff[poll.createdBy].id, targetId: id, createdAt })
  if (closed) {
    auditRows.push({ action: 'POLL_CLOSED_AUTOMATICALLY', targetId: id, createdAt: endsAt, details: { endsAt: endsAt.toISOString() } })
  }

  const voters = shuffled(citizens).slice(0, Math.round(CITIZEN_COUNT * poll.turnout))
  participants.set(poll.title, voters)
  const lastMoment = Math.min(endsAt.getTime(), now)

  for (const voter of voters) {
    // a maioria vota no começo, quando a pauta é divulgada
    const moment = startsAt.getTime() + (lastMoment - startsAt.getTime()) * random() ** 1.8
    participationRows.push({ pollId: id, userId: voter.id, createdAt: new Date(moment) })
  }

  // RNF05: os votos entram só como contagem por opção, sem vínculo com quem participou
  const forCount = Math.round((voters.length * poll.lean[0]) / 100)
  const againstCount = Math.round((voters.length * poll.lean[1]) / 100)
  const options: [VoteOption, number][] = [
    ['FOR', forCount],
    ['AGAINST', againstCount],
    ['ABSTAIN', voters.length - forCount - againstCount],
  ]
  for (const [option, count] of options) {
    voteRows.push(...Array.from({ length: count }, () => ({ pollId: id, option })))
  }

  poll.comments.forEach((text, index) => {
    const createdAt = new Date(startsAt.getTime() + (lastMoment - startsAt.getTime()) * ((index + 1) / (poll.comments.length + 2)))
    const moderator = pick(moderators)
    const commentId = crypto.randomUUID()
    commentRows.push({
      id: commentId,
      text,
      status: 'APPROVED',
      classification: 'ADEQUATE',
      pollId: id,
      authorId: voters[index].id,
      moderatedById: moderator.id,
      createdAt,
      updatedAt: new Date(createdAt.getTime() + 2 * HOUR_MS),
    })
    auditRows.push({
      action: 'COMMENT_MODERATED',
      actorId: moderator.id,
      targetId: commentId,
      createdAt: new Date(createdAt.getTime() + 2 * HOUR_MS),
      details: { action: 'APPROVE' },
    })
  })
}

function authorFor(pollTitle: string, offset: number) {
  const voters = participants.get(pollTitle) ?? []
  return voters[voters.length - 1 - offset]
}

const pollIdOf = (title: string) => pollIds.get(title) ?? ''

PENDING_COMMENTS.forEach(({ poll, text, hours, classification, reason }, index) => {
  commentRows.push({
    id: crypto.randomUUID(),
    text,
    status: 'PENDING',
    classification,
    moderationReason: reason,
    pollId: pollIdOf(poll),
    authorId: authorFor(poll, index).id,
    createdAt: hoursAgo(hours),
    updatedAt: hoursAgo(hours),
  })
})

const reportRows: {
  reason: CommentReportReason
  status: 'PENDING' | 'DISMISSED' | 'ACTIONED'
  commentId: string
  reporterId: string
  createdAt: Date
  reviewedAt?: Date
  reviewedById?: string
}[] = []

REPORTED_COMMENTS.forEach(({ poll, text, reasons, days }, index) => {
  const id = crypto.randomUUID()
  const createdAt = daysFromNow(-days)
  commentRows.push({
    id,
    text,
    status: 'APPROVED',
    classification: 'ADEQUATE',
    pollId: pollIdOf(poll),
    authorId: authorFor(poll, 10 + index).id,
    createdAt,
    updatedAt: createdAt,
  })
  reasons.forEach((reason, reportIndex) => {
    reportRows.push({
      reason,
      status: 'PENDING',
      commentId: id,
      reporterId: citizens[index * 10 + reportIndex].id,
      createdAt: hoursAgo(20 - reportIndex * 4),
    })
  })
})

REJECTED_COMMENTS.forEach(({ poll, text, reason, days }, index) => {
  const id = crypto.randomUUID()
  const decidedAt = new Date(daysFromNow(-days).getTime() + 3 * HOUR_MS)
  const moderator = moderators[index % 2]
  commentRows.push({
    id,
    text,
    status: 'REJECTED',
    classification: 'SUSPECT',
    moderationReason: reason,
    pollId: pollIdOf(poll),
    authorId: authorFor(poll, 20 + index).id,
    moderatedById: moderator.id,
    createdAt: daysFromNow(-days),
    updatedAt: decidedAt,
  })
  auditRows.push({ action: 'COMMENT_MODERATED', actorId: moderator.id, targetId: id, createdAt: decidedAt, details: { action: 'REJECT', reason } })
})

const removedId = crypto.randomUUID()
const removedAt = daysFromNow(-72)
commentRows.push({
  id: removedId,
  text: REMOVED_COMMENT.text,
  status: 'REMOVED',
  classification: 'ADEQUATE',
  moderationReason: REMOVED_COMMENT.reason,
  pollId: pollIdOf(REMOVED_COMMENT.poll),
  authorId: authorFor(REMOVED_COMMENT.poll, 30).id,
  moderatedById: staff.moderadora.id,
  createdAt: daysFromNow(-75),
  updatedAt: removedAt,
})
reportRows.push({
  reason: 'HATE_SPEECH',
  status: 'ACTIONED',
  commentId: removedId,
  reporterId: citizens[40].id,
  createdAt: daysFromNow(-74),
  reviewedAt: removedAt,
  reviewedById: staff.moderadora.id,
})
auditRows.push({
  action: 'COMMENT_MODERATED',
  actorId: staff.moderadora.id,
  targetId: removedId,
  createdAt: removedAt,
  details: { action: 'REMOVE', reason: REMOVED_COMMENT.reason },
})

const dismissedId = crypto.randomUUID()
const dismissedAt = daysFromNow(-45)
commentRows.push({
  id: dismissedId,
  text: DISMISSED_REPORT_COMMENT.text,
  status: 'APPROVED',
  classification: 'ADEQUATE',
  pollId: pollIdOf(DISMISSED_REPORT_COMMENT.poll),
  authorId: authorFor(DISMISSED_REPORT_COMMENT.poll, 31).id,
  createdAt: daysFromNow(-50),
  updatedAt: dismissedAt,
})
reportRows.push({
  reason: 'OTHER',
  status: 'DISMISSED',
  commentId: dismissedId,
  reporterId: citizens[41].id,
  createdAt: daysFromNow(-46),
  reviewedAt: dismissedAt,
  reviewedById: staff.moderador.id,
})
auditRows.push({
  action: 'COMMENT_MODERATED',
  actorId: staff.moderador.id,
  targetId: dismissedId,
  createdAt: dismissedAt,
  details: { action: 'DISMISS_REPORT' },
})

await prisma.participations.createMany({ data: participationRows })
await prisma.votes.createMany({ data: shuffled(voteRows) })
await prisma.comments.createMany({ data: commentRows })
await prisma.commentReports.createMany({ data: reportRows })
await prisma.auditLogs.createMany({ data: auditRows })

console.log(`✅ ${POLLS.length} pautas, ${users.length} contas, ${participationRows.length} participações e ${commentRows.length} comentários.`)
console.log(`   Logins: admin, gestor, gestora, moderadora, moderador e cidadao1 a cidadao${CITIZEN_COUNT} em @${DEMO_DOMAIN}.`)
console.log('   Senha de todas as contas: DEMO_SEED_PASSWORD ou, sem ela, a constante em prisma/seed-demo.ts.')
await prisma.$disconnect()
