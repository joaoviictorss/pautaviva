import { Prisma, type PollStatus, type Polls } from '@prisma/client'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import PDFDocument from 'pdfkit'
import { z } from 'zod'

import { prisma } from '../../lib/prisma.js'
import { BadRequestError } from './_errors/bad-request-error.js'
import { emitLive } from '../sockets/index.js'
import { ConflictError } from './_errors/conflict-error.js'
import { NotFoundError } from './_errors/not-found-error.js'
import { UnauthorizedError } from './_errors/unauthorized-error.js'

const DAY_MS = 24 * 60 * 60 * 1000
const STAFF_ROLES = ['MANAGER', 'MODERATOR', 'ADMIN'] as const
const TIME_ZONE = 'America/Sao_Paulo'

const dayKey = (date: Date) => date.toLocaleDateString('en-CA', { timeZone: TIME_ZONE })

function statusOf(poll: Pick<Polls, 'startsAt' | 'endsAt' | 'status'>, now = new Date()): PollStatus {
  if (poll.status === 'CLOSED' || poll.endsAt <= now) return 'CLOSED'
  return poll.startsAt > now ? 'SCHEDULED' : 'OPEN'
}

const pollBody = z.object({
  description: z.string().trim().min(10).max(2000),
  categoryId: z.uuid(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
})

const pollQuery = z.object({
  categoryId: z.uuid().optional(),
  search: z.string().trim().optional(),
  status: z.enum(['SCHEDULED', 'OPEN', 'CLOSED']).optional(),
  sort: z.enum(['recent', 'start', 'ending']).default('recent'),
  /** Só as pautas em que o cidadão logado ainda não votou. */
  missing: z.stringbool().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(9),
})

const participationQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(9),
})

const agendaQuery = z.object({
  year: z.coerce.number().int().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12),
})

const exportQuery = z.object({ format: z.enum(['csv', 'pdf']) })
const dashboardQuery = z.object({ days: z.coerce.number().pipe(z.literal([7, 30, 90])).default(30) })
const pollParams = z.object({ id: z.uuid() })

const SUMMARY_PENDING = 3
const SUMMARY_RESULTS = 3
const AGENDA_MARGIN_MS = 7 * 24 * 60 * 60 * 1000

function validatePeriod({ startsAt, endsAt }: { startsAt: Date; endsAt: Date }) {
  const now = Date.now()
  // o front manda o início do dia local; até 1 dia atrás ainda é "hoje" em qualquer fuso
  if (startsAt.getTime() < now - DAY_MS) throw new BadRequestError('A data de início não pode estar no passado.')
  if (endsAt <= startsAt || endsAt.getTime() <= now) {
    throw new BadRequestError('A data de término deve ser posterior à data de início.')
  }
}

interface PollSlice {
  where: Prisma.PollsWhereInput
  orderBy: Prisma.PollsOrderByWithRelationInput[]
}

function statusWhere(status: PollStatus, now: Date): Prisma.PollsWhereInput {
  if (status === 'CLOSED') return { OR: [{ status: 'CLOSED' }, { endsAt: { lte: now } }] }
  return {
    status: { not: 'CLOSED' },
    startsAt: status === 'OPEN' ? { lte: now } : { gt: now },
    endsAt: { gt: now },
  }
}

const pollSelect = {
  id: true,
  title: true,
  description: true,
  startsAt: true,
  endsAt: true,
  status: true,
  category: { select: { id: true, name: true } },
  _count: { select: { participations: true } },
} satisfies Prisma.PollsSelect


function toPollView({ _count, ...poll }: Prisma.PollsGetPayload<{ select: typeof pollSelect }>, votes: VoteCount[]) {
  const results = { FOR: 0, AGAINST: 0, ABSTAIN: 0 }
  for (const row of votes) if (row.pollId === poll.id) results[row.option] = row.count
  return { ...poll, status: statusOf(poll), participations: _count.participations, results }
}

/** Rotas públicas que mudam para quem está logado: sem sessão, seguem como visitante. */
function optionalUser(request: FastifyRequest) {
  return request.getCurrentUser().catch((error: unknown) => {
    if (error instanceof UnauthorizedError) return null
    throw error
  })
}

async function countVotes(where: Prisma.VotesWhereInput = {}) {
  const rows = await prisma.votes.groupBy({ by: ['pollId', 'option'], where, _count: { _all: true } })
  return rows.map((row) => ({ pollId: row.pollId, option: row.option, count: row._count._all }))
}

type VoteCount = Awaited<ReturnType<typeof countVotes>>[number]

async function broadcastResults(pollId: string) {
  const [votes, participations] = await Promise.all([
    countVotes({ pollId }),
    prisma.participations.count({ where: { pollId } }),
  ])
  const results = { FOR: 0, AGAINST: 0, ABSTAIN: 0 }
  for (const row of votes) results[row.option] = row.count
  emitLive('poll-results', { pollId, results, participations })
}

function csvCell(value: string | number) {
  const text = typeof value === 'string' && /^\s*[=+\-@]/.test(value) ? `'${value}` : String(value)
  return `"${text.replaceAll('"', '""')}"`
}

function exportFilename(title: string, extension: string) {
  const slug = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${slug || 'pauta'}-resultados.${extension}`
}

function createResultsPdf(
  poll: Polls,
  results: { FOR: number; AGAINST: number; ABSTAIN: number },
  totalVotes: number,
  participations: number,
  comments: { text: string; createdAt: Date; author: { name: string } }[],
) {
  const document = new PDFDocument({ margin: 48 })
  const chunks: Buffer[] = []
  const buffer = new Promise<Buffer>((resolve, reject) => {
    document.on('data', (chunk: Buffer) => chunks.push(chunk))
    document.on('end', () => resolve(Buffer.concat(chunks)))
    document.on('error', reject)
  })

  document.fontSize(20).font('Helvetica-Bold').text('Resultados finais')
  document.moveDown(0.5).fontSize(15).font('Helvetica').text(poll.title)
  document.moveDown(0.5).fontSize(10).text(`Encerrada em: ${poll.endsAt.toLocaleString('pt-BR')}`)
  document.moveDown().fontSize(13).font('Helvetica-Bold').text('Votos por opção')
  document.moveDown(0.4).fontSize(11).font('Helvetica')

  const voteRows: [string, number][] = [
    ['A favor', results.FOR],
    ['Contra', results.AGAINST],
    ['Abstenção', results.ABSTAIN],
  ]
  for (const [label, count] of voteRows) {
    const percent = totalVotes ? ((count / totalVotes) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '0'
    document.text(`${label}: ${count} voto(s) · ${percent}%`)
  }

  document.moveDown(0.5).font('Helvetica-Bold').text(`Total de participantes: ${participations}`)
  document.moveDown().fontSize(13).text(`Comentários publicados (${comments.length})`)
  document.moveDown(0.4).fontSize(10).font('Helvetica')

  if (comments.length === 0) document.text('Não há comentários publicados.')
  for (const comment of comments) {
    document.font('Helvetica-Bold').text(`${comment.author.name} · ${comment.createdAt.toLocaleString('pt-BR')}`)
    document.font('Helvetica').text(comment.text).moveDown(0.6)
  }

  document.end()
  return buffer
}

export async function pollRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>()

  // Consulta pública (UC04): categorias, lista e detalhe não exigem login.
  api.get('/categories', async () => {
    return prisma.categories.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } })
  })

  const agendaPolls = async (request: FastifyRequest, where: Prisma.PollsWhereInput) => {
    const currentUser = await optionalUser(request)
    const polls = await prisma.polls.findMany({ where, select: pollSelect, orderBy: [{ startsAt: 'asc' }, { id: 'asc' }] })
    const ids = polls.map(({ id }) => id)
    const [votes, voted] = await Promise.all([
      ids.length ? countVotes({ pollId: { in: ids } }) : [],
      currentUser ? prisma.participations.findMany({ where: { userId: currentUser.id, pollId: { in: ids } }, select: { pollId: true } }) : [],
    ])

    return polls.map((poll) => ({ ...toPollView(poll, votes), hasVoted: voted.some(({ pollId }) => pollId === poll.id) }))
  }

  api.get('/agenda', { schema: { querystring: agendaQuery } }, async (request) => {
    const { year, month } = request.query
    // folga de uma semana: o calendário também mostra os dias vizinhos e o fuso do navegador pode mudar o dia
    const start = new Date(Date.UTC(year, month - 1, 1) - AGENDA_MARGIN_MS)
    const end = new Date(Date.UTC(year, month, 1) + AGENDA_MARGIN_MS)
    const inMonth = { gte: start, lt: end }

    return agendaPolls(request, { OR: [{ startsAt: inMonth }, { endsAt: inMonth }] })
  })

  api.get('/agenda/upcoming', async (request) => {
    return agendaPolls(request, { status: { not: 'CLOSED' }, endsAt: { gt: new Date() } })
  })

  api.get('/participations/me', { schema: { querystring: participationQuery } }, async (request) => {
    const user = await request.requireRole('CITIZEN')
    const now = new Date()
    const { page, pageSize } = request.query
    const where = { userId: user.id }
    const [total, resultsAvailable, participations] = await Promise.all([
      prisma.participations.count({ where }),
      prisma.participations.count({
        where: {
          ...where,
          poll: {
            OR: [
              { status: 'CLOSED' },
              { endsAt: { lte: now } },
              { startsAt: { lte: now }, endsAt: { gt: now } },
            ],
          },
        },
      }),
      prisma.participations.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { createdAt: true, poll: { select: pollSelect } },
      }),
    ])
    const votes = participations.length
      ? await countVotes({ pollId: { in: participations.map(({ poll }) => poll.id) } })
      : []

    return {
      total,
      resultsAvailable,
      page,
      pageSize,
      items: participations.map(({ createdAt, poll }) => ({
        participatedAt: createdAt,
        resultsAvailable: statusOf(poll, now) !== 'SCHEDULED',
        poll: toPollView(poll, votes),
      })),
    }
  })

  api.get('/participations/me/summary', async (request) => {
    const user = await request.requireRole('CITIZEN')
    const now = new Date()
    const pendingWhere = {
      AND: [statusWhere('OPEN', now), { participations: { none: { userId: user.id } } }],
    }
    const [participations, pendingTotal, pendingPolls] = await Promise.all([
      prisma.participations.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true, poll: { select: pollSelect } },
      }),
      prisma.polls.count({ where: pendingWhere }),
      prisma.polls.findMany({
        where: pendingWhere,
        select: pollSelect,
        orderBy: [{ endsAt: 'asc' }, { id: 'asc' }],
        take: SUMMARY_PENDING,
      }),
    ])
    const votes = await countVotes({ pollId: { in: [...participations.map(({ poll }) => poll.id), ...pendingPolls.map(({ id }) => id)] } })
    const closed = participations
      .map(({ poll }) => toPollView(poll, votes))
      .filter((poll) => poll.status === 'CLOSED')
      .sort((a, b) => b.endsAt.getTime() - a.endsAt.getTime())

    return {
      total: participations.length,
      pendingTotal,
      pending: pendingPolls.map((poll) => toPollView(poll, votes)),
      approved: closed.filter(({ results }) => results.FOR > results.AGAINST).length,
      results: closed.slice(0, SUMMARY_RESULTS),
      activity: participations.map(({ createdAt, poll }) => ({ participatedAt: createdAt, category: poll.category.name })),
    }
  })

  api.put('/polls/:id/reminder', { schema: { params: pollParams } }, async (request, reply) => {
    const user = await request.requireRole('CITIZEN')
    const poll = await prisma.polls.findUnique({ where: { id: request.params.id } })
    if (!poll) throw new NotFoundError('Pauta não encontrada.')
    if (statusOf(poll) !== 'SCHEDULED') throw new BadRequestError('Só pautas agendadas aceitam lembrete.')

    await prisma.pollReminders.upsert({
      where: { pollId_userId: { pollId: poll.id, userId: user.id } },
      create: { pollId: poll.id, userId: user.id },
      update: {},
    })
    return reply.status(204).send()
  })

  api.delete('/polls/:id/reminder', { schema: { params: pollParams } }, async (request, reply) => {
    const user = await request.requireRole('CITIZEN')
    await prisma.pollReminders.deleteMany({ where: { pollId: request.params.id, userId: user.id } })
    return reply.status(204).send()
  })

  api.get('/polls', { schema: { querystring: pollQuery } }, async (request) => {
    const now = new Date()
    const { categoryId, search, status, sort, missing, page, pageSize } = request.query
    const currentUser = await optionalUser(request)
    const baseConditions = [
      ...(categoryId ? [{ categoryId }] : []),
      ...(search
        ? [
            {
              OR: [
                { title: { contains: search, mode: 'insensitive' as const } },
                { category: { name: { contains: search, mode: 'insensitive' as const } } },
              ],
            },
          ]
        : []),
    ]
    const conditions = [
      ...baseConditions,
      ...(status ? [statusWhere(status, now)] : []),
      ...(missing && currentUser ? [{ participations: { none: { userId: currentUser.id } } }] : []),
    ]
    const where = conditions.length ? { AND: conditions } : undefined

    const [total, open, scheduled, closed] = await Promise.all([
      prisma.polls.count({ where }),
      ...(['OPEN', 'SCHEDULED', 'CLOSED'] as const).map((value) =>
        prisma.polls.count({ where: { AND: [...baseConditions, statusWhere(value, now)] } }),
      ),
    ])
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const currentPage = Math.min(page, totalPages)
    const select = {
      id: true,
      title: true,
      description: true,
      startsAt: true,
      endsAt: true,
      status: true,
      category: { select: { id: true, name: true } },
      _count: { select: { participations: true } },
    } as const
    const offset = (currentPage - 1) * pageSize

    // Pagina duas listas como se fossem uma só: a segunda começa onde a primeira acaba.
    const pageAcross = async (first: PollSlice, second: PollSlice) => {
      const firstTotal = await prisma.polls.count({ where: first.where })
      const firstTake = Math.max(0, Math.min(pageSize, firstTotal - offset))
      const secondTake = pageSize - firstTake
      const [firstItems, secondItems] = await Promise.all([
        firstTake
          ? prisma.polls.findMany({ ...first, select, skip: Math.min(offset, firstTotal), take: firstTake })
          : [],
        secondTake
          ? prisma.polls.findMany({ ...second, select, skip: Math.max(0, offset - firstTotal), take: secondTake })
          : [],
      ])
      return [...firstItems, ...secondItems]
    }

    let polls

    if (sort === 'recent') {
      // Agendadas por último: antes vem o que já dá para votar ou consultar o resultado.
      const scheduled = statusWhere('SCHEDULED', now)
      const orderBy = [{ createdAt: 'desc' as const }, { id: 'desc' as const }]
      polls = await pageAcross(
        { where: { AND: [...conditions, { NOT: scheduled }] }, orderBy },
        { where: { AND: [...conditions, scheduled] }, orderBy },
      )
    } else {
      const upcomingConditions = [
        ...conditions,
        { status: { not: 'CLOSED' as const } },
        sort === 'start' ? { startsAt: { gt: now }, endsAt: { gt: now } } : { endsAt: { gt: now } },
      ]
      const completedConditions = [
        ...conditions,
        {
          OR:
            sort === 'start'
              ? [{ status: 'CLOSED' as const }, { startsAt: { lte: now } }, { endsAt: { lte: now } }]
              : [{ status: 'CLOSED' as const }, { endsAt: { lte: now } }],
        },
      ]
      const orderBy =
        sort === 'start'
          ? [{ startsAt: 'asc' as const }, { id: 'asc' as const }]
          : [{ endsAt: 'asc' as const }, { id: 'asc' as const }]
      const completedOrderBy =
        sort === 'start'
          ? [{ startsAt: 'desc' as const }, { id: 'desc' as const }]
          : [{ endsAt: 'desc' as const }, { id: 'desc' as const }]
      polls = await pageAcross(
        { where: { AND: upcomingConditions }, orderBy },
        { where: { AND: completedConditions }, orderBy: completedOrderBy },
      )
    }
    const votes = polls.length
      ? await countVotes({ pollId: { in: polls.map(({ id }) => id) } })
      : []
    const ids = polls.map(({ id }) => id)
    const [voted, reminded] = currentUser
      ? await Promise.all([
          prisma.participations.findMany({ where: { userId: currentUser.id, pollId: { in: ids } }, select: { pollId: true } }),
          prisma.pollReminders.findMany({ where: { userId: currentUser.id, pollId: { in: ids } }, select: { pollId: true } }),
        ])
      : [[], []]

    return {
      items: polls.map((poll) => ({
        ...toPollView(poll, votes),
        hasVoted: voted.some(({ pollId }) => pollId === poll.id),
        hasReminder: reminded.some(({ pollId }) => pollId === poll.id),
      })),
      total,
      counts: { OPEN: open, SCHEDULED: scheduled, CLOSED: closed },
      page: currentPage,
      pageSize,
    }
  })

  api.get('/polls/:id', { schema: { params: pollParams } }, async (request) => {
    const poll = await prisma.polls.findUnique({
      where: { id: request.params.id },
      select: pollSelect,
    })
    if (!poll) throw new NotFoundError('Pauta não encontrada.')

    const [votes, currentUser] = await Promise.all([
      countVotes({ pollId: poll.id }),
      optionalUser(request),
    ])
    const key = currentUser && { pollId_userId: { pollId: poll.id, userId: currentUser.id } }
    const [participation, reminder] = key
      ? await Promise.all([prisma.participations.findUnique({ where: key }), prisma.pollReminders.findUnique({ where: key })])
      : [null, null]

    return { ...toPollView(poll, votes), hasVoted: !!participation, hasReminder: !!reminder }
  })

  api.get('/dashboard', { schema: { querystring: dashboardQuery } }, async (request) => {
    await request.requireRole(...STAFF_ROLES)
    const { days } = request.query
    const now = new Date()
    const since = new Date(now.getTime() - days * DAY_MS)
    const before = new Date(now.getTime() - 2 * days * DAY_MS)
    const overdue = new Date(now.getTime() - DAY_MS)
    const moderationQueue: Prisma.CommentsWhereInput = {
      OR: [{ status: 'PENDING' }, { reports: { some: { status: 'PENDING' } } }],
    }
    const dayKeys = Array.from({ length: days }, (_, index) => dayKey(new Date(now.getTime() - (days - 1 - index) * DAY_MS)))

    const [
      openPolls,
      openPollsBefore,
      [period],
      pendingModeration,
      overdueModeration,
      byDay,
      byCategory,
      endingSoon,
      upcoming,
    ] = await Promise.all([
      prisma.polls.count({ where: statusWhere('OPEN', now) }),
      prisma.polls.count({ where: { startsAt: { lte: since }, endsAt: { gt: since } } }),
      prisma.$queryRaw<{ participations: bigint; previousParticipations: bigint; citizens: bigint; previousCitizens: bigint }[]>`
        SELECT
          COUNT(*) FILTER (WHERE "createdAt" >= ${since}) AS "participations",
          COUNT(*) FILTER (WHERE "createdAt" < ${since}) AS "previousParticipations",
          COUNT(DISTINCT "userId") FILTER (WHERE "createdAt" >= ${since}) AS "citizens",
          COUNT(DISTINCT "userId") FILTER (WHERE "createdAt" < ${since}) AS "previousCitizens"
        FROM participations
        WHERE "createdAt" >= ${before}
      `,
      prisma.comments.count({ where: moderationQueue }),
      prisma.comments.count({ where: { ...moderationQueue, createdAt: { lt: overdue } } }),
      prisma.$queryRaw<{ day: string; count: bigint }[]>`
        SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${TIME_ZONE}, 'YYYY-MM-DD') AS day, COUNT(*) AS count
        FROM participations
        WHERE "createdAt" >= ${since}
        GROUP BY day
      `,
      prisma.$queryRaw<{ name: string; count: bigint }[]>`
        SELECT category.name, COUNT(*) AS count
        FROM participations participation
        JOIN polls poll ON poll.id = participation."pollId"
        JOIN categories category ON category.id = poll."categoryId"
        WHERE participation."createdAt" >= ${since}
        GROUP BY category.name
        ORDER BY count DESC, category.name
        LIMIT 6
      `,
      prisma.polls.findMany({
        where: statusWhere('OPEN', now),
        select: pollSelect,
        orderBy: [{ endsAt: 'asc' }, { id: 'asc' }],
        take: 4,
      }),
      prisma.polls.findMany({
        where: statusWhere('SCHEDULED', now),
        select: { id: true, title: true, startsAt: true, endsAt: true, category: { select: { name: true } } },
        orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
        take: 4,
      }),
    ])

    const countByDay = new Map(byDay.map((row) => [row.day, Number(row.count)]))
    const votes = await countVotes({ pollId: { in: endingSoon.map((poll) => poll.id) } })

    return {
      openPolls: { current: openPolls, previous: openPollsBefore },
      participations: { current: Number(period.participations), previous: Number(period.previousParticipations) },
      citizens: { current: Number(period.citizens), previous: Number(period.previousCitizens) },
      moderation: { pending: pendingModeration, overdue: overdueModeration },
      participationsByDay: dayKeys.map((day) => ({ day, count: countByDay.get(day) ?? 0 })),
      participationsByCategory: byCategory.map(({ name, count }) => ({ name, count: Number(count) })),
      endingSoon: endingSoon.map((poll) => toPollView(poll, votes)),
      upcoming,
    }
  })

  api.get('/polls/:id/stats', { schema: { params: pollParams } }, async (request) => {
    await request.requireRole(...STAFF_ROLES)
    const { id } = request.params
    const poll = await prisma.polls.findUnique({
      where: { id },
      select: { ...pollSelect, createdAt: true, createdBy: { select: { name: true } } },
    })
    if (!poll) throw new NotFoundError('Pauta não encontrada.')

    const [votes, commentsByStatus, pendingReports, history, byDay] = await Promise.all([
      countVotes({ pollId: id }),
      prisma.comments.groupBy({ by: ['status'], where: { pollId: id }, _count: { _all: true } }),
      prisma.commentReports.count({ where: { status: 'PENDING', comment: { pollId: id } } }),
      prisma.auditLogs.findMany({
        where: { targetId: id },
        select: { id: true, action: true, createdAt: true, actor: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.$queryRaw<{ day: string; count: bigint }[]>`
        SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${TIME_ZONE}, 'YYYY-MM-DD') AS day, COUNT(*) AS count
        FROM participations
        WHERE "pollId" = ${id}
        GROUP BY day
      `,
    ])

    const countByDay = new Map(byDay.map((row) => [row.day, Number(row.count)]))
    const lastDay = Math.min(poll.endsAt.getTime(), Date.now())
    const dayKeys = new Set<string>()
    for (let time = poll.startsAt.getTime(); time <= lastDay; time += DAY_MS) dayKeys.add(dayKey(new Date(time)))
    if (poll.startsAt.getTime() <= lastDay) dayKeys.add(dayKey(new Date(lastDay)))

    const comments = { PENDING: 0, APPROVED: 0, REJECTED: 0, REMOVED: 0 }
    for (const row of commentsByStatus) comments[row.status] = row._count._all

    return {
      ...toPollView(poll, votes),
      createdAt: poll.createdAt,
      createdBy: poll.createdBy.name,
      comments,
      pendingReports,
      participationsByDay: [...dayKeys].map((day) => ({ day, count: countByDay.get(day) ?? 0 })),
      history: history.map(({ actor, ...entry }) => ({ ...entry, actorName: actor?.name ?? null })),
    }
  })

  api.get(
    '/polls/:id/export',
    { schema: { params: pollParams, querystring: exportQuery } },
    async (request, reply) => {
      await request.requireRole(...STAFF_ROLES)
      const poll = await prisma.polls.findUnique({ where: { id: request.params.id } })
      if (!poll) throw new NotFoundError('Pauta não encontrada.')
      if (statusOf(poll) !== 'CLOSED') {
        throw new BadRequestError('A exportação só está disponível após o encerramento da votação.')
      }

      const [votes, participations, comments] = await Promise.all([
        countVotes({ pollId: poll.id }),
        prisma.participations.count({ where: { pollId: poll.id } }),
        prisma.comments.findMany({
          where: { pollId: poll.id, status: 'APPROVED' },
          select: { text: true, createdAt: true, author: { select: { name: true } } },
          orderBy: { createdAt: 'asc' },
        }),
      ])
      const results = { FOR: 0, AGAINST: 0, ABSTAIN: 0 }
      for (const vote of votes) results[vote.option] = vote.count
      const totalVotes = results.FOR + results.AGAINST + results.ABSTAIN
      const filename = exportFilename(poll.title, request.query.format)

      if (request.query.format === 'csv') {
        const percentage = (count: number) =>
          totalVotes ? `${((count / totalVotes) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%` : '0%'
        const rows: (string | number)[][] = [
          ['Resultados finais', poll.title],
          ['Encerrada em', poll.endsAt.toISOString()],
          [],
          ['Opção', 'Votos', 'Percentual'],
          ['A favor', results.FOR, percentage(results.FOR)],
          ['Contra', results.AGAINST, percentage(results.AGAINST)],
          ['Abstenção', results.ABSTAIN, percentage(results.ABSTAIN)],
          ['Total de participantes', participations],
          [],
          ['Comentários publicados'],
          ['Autor', 'Data', 'Comentário'],
          ...comments.map((comment) => [comment.author.name, comment.createdAt.toISOString(), comment.text]),
        ]
        const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`
        return reply
          .type('text/csv; charset=utf-8')
          .header('Content-Disposition', `attachment; filename="${filename}"`)
          .send(csv)
      }

      const pdf = await createResultsPdf(poll, results, totalVotes, participations, comments)
      return reply
        .type('application/pdf')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(pdf)
    },
  )

  // Participação e voto em tabelas separadas, na mesma transação: o voto não guarda quem votou (RNF05).
  api.post(
    '/polls/:id/votes',
    { schema: { params: pollParams, body: z.object({ option: z.enum(['FOR', 'AGAINST', 'ABSTAIN']) }) } },
    async (request, reply) => {
      const user = await request.requireRole('CITIZEN')
      const poll = await prisma.polls.findUnique({ where: { id: request.params.id } })
      if (!poll) throw new NotFoundError('Pauta não encontrada.')
      if (statusOf(poll) !== 'OPEN') {
        throw new BadRequestError('Esta pauta não está disponível para votação no momento.')
      }

      try {
        await prisma.$transaction([
          prisma.participations.create({ data: { pollId: poll.id, userId: user.id } }),
          prisma.votes.create({ data: { pollId: poll.id, option: request.body.option } }),
        ])
      } catch (err) {
        // o unique (pollId, userId) barra o voto duplicado, inclusive em requisições simultâneas
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          throw new ConflictError('Você já votou nesta pauta.')
        }
        throw err
      }

      // falha na propagação não afeta a confirmação do voto; o cliente ressincroniza ao reconectar (UC05, E03)
      broadcastResults(poll.id).catch((err) => request.log.error(err, 'falha ao propagar resultados'))

      return reply.status(201).send()
    }
  )

  api.post(
    '/polls',
    { schema: { body: pollBody.extend({ title: z.string().trim().min(5).max(90) }) } },
    async (request, reply) => {
      const user = await request.requireRole(...STAFF_ROLES)
      const data = request.body
      validatePeriod(data)
      const category = await prisma.categories.findUnique({ where: { id: data.categoryId }, select: { id: true } })
      if (!category) throw new BadRequestError('Categoria não encontrada.')

      const poll = await prisma.$transaction(async (transaction) => {
        const createdPoll = await transaction.polls.create({
          data: { ...data, status: statusOf({ ...data, status: 'SCHEDULED' }), createdById: user.id },
        })
        await transaction.auditLogs.create({
          data: { action: 'POLL_CREATED', actorId: user.id, targetId: createdPoll.id },
        })
        return createdPoll
      })
      emitLive('polls-changed', { pollId: poll.id })

      return reply.status(201).send({ id: poll.id, status: poll.status })
    }
  )
  api.patch(
    '/polls/:id',
    {
      schema: {
        params: pollParams,
        body: pollBody.extend({ title: z.string().trim().min(5).max(90) }),
      },
    },
    async (request, reply) => {
      const user = await request.requireRole(...STAFF_ROLES)
      const poll = await prisma.polls.findUnique({ where: { id: request.params.id } })
      if (!poll) throw new NotFoundError('Pauta não encontrada.')
      if (statusOf(poll) !== 'SCHEDULED') throw new BadRequestError('Só pautas agendadas podem ser editadas.')

      const data = request.body
      validatePeriod(data)
      const category = await prisma.categories.findUnique({ where: { id: data.categoryId }, select: { id: true } })
      if (!category) throw new BadRequestError('Categoria não encontrada.')

      await prisma.$transaction([
        prisma.polls.update({
          where: { id: poll.id },
          data: { ...data, status: statusOf({ ...data, status: 'SCHEDULED' }) },
        }),
        prisma.auditLogs.create({ data: { action: 'POLL_UPDATED', actorId: user.id, targetId: poll.id } }),
      ])
      emitLive('polls-changed', { pollId: poll.id })

      return reply.status(204).send()
    }
  )
}
