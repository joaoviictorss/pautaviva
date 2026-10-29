import { Prisma, type PollStatus, type Polls } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '../../lib/prisma.js'
import { BadRequestError } from './_errors/bad-request-error.js'
import { emitToPoll } from '../sockets/index.js'
import { ConflictError } from './_errors/conflict-error.js'
import { NotFoundError } from './_errors/not-found-error.js'
import { UnauthorizedError } from './_errors/unauthorized-error.js'

const DAY_MS = 24 * 60 * 60 * 1000

// shortcut: situação calculada pelas datas até existir o job de abertura/encerramento (HU10).
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
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(9),
})

const pollParams = z.object({ id: z.uuid() })

function validatePeriod({ startsAt, endsAt }: { startsAt: Date; endsAt: Date }) {
  const now = Date.now()
  // o front manda o início do dia local; até 1 dia atrás ainda é "hoje" em qualquer fuso
  if (startsAt.getTime() < now - DAY_MS) throw new BadRequestError('A data de início não pode estar no passado.')
  if (endsAt <= startsAt || endsAt.getTime() <= now) {
    throw new BadRequestError('A data de término deve ser posterior à data de início.')
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
  emitToPoll(pollId, 'poll-results', { results, participations })
}

export async function pollRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>()

  // Consulta pública (UC04): categorias, lista e detalhe não exigem login.
  api.get('/categories', async () => {
    return prisma.categories.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } })
  })

  api.get('/polls', { schema: { querystring: pollQuery } }, async (request) => {
    const now = new Date()
    const { categoryId, search, status, sort, page, pageSize } = request.query
    const conditions = [
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
      ...(status === 'SCHEDULED'
        ? [{ status: { not: 'CLOSED' as const }, startsAt: { gt: now }, endsAt: { gt: now } }]
        : []),
      ...(status === 'OPEN'
        ? [{ status: { not: 'CLOSED' as const }, startsAt: { lte: now }, endsAt: { gt: now } }]
        : []),
      ...(status === 'CLOSED' ? [{ OR: [{ status: 'CLOSED' as const }, { endsAt: { lte: now } }] }] : []),
    ]
    const where = conditions.length ? { AND: conditions } : undefined

    const total = await prisma.polls.count({ where })
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
    let polls

    if (sort === 'recent') {
      polls = await prisma.polls.findMany({
        where,
        select,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: offset,
        take: pageSize,
      })
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
      const upcomingWhere = { AND: upcomingConditions }
      const completedWhere = { AND: completedConditions }
      const upcomingTotal = await prisma.polls.count({ where: upcomingWhere })
      const upcomingSkip = Math.min(offset, upcomingTotal)
      const upcomingTake = Math.max(0, Math.min(pageSize, upcomingTotal - offset))
      const completedSkip = Math.max(0, offset - upcomingTotal)
      const completedTake = pageSize - upcomingTake
      const orderBy =
        sort === 'start'
          ? [{ startsAt: 'asc' as const }, { id: 'asc' as const }]
          : [{ endsAt: 'asc' as const }, { id: 'asc' as const }]
      const completedOrderBy =
        sort === 'start'
          ? [{ startsAt: 'desc' as const }, { id: 'desc' as const }]
          : [{ endsAt: 'desc' as const }, { id: 'desc' as const }]
      const [upcoming, completed] = await Promise.all([
        upcomingTake
          ? prisma.polls.findMany({
              where: upcomingWhere,
              select,
              orderBy,
              skip: upcomingSkip,
              take: upcomingTake,
            })
          : [],
        completedTake
          ? prisma.polls.findMany({
              where: completedWhere,
              select,
              orderBy: completedOrderBy,
              skip: completedSkip,
              take: completedTake,
            })
          : [],
      ])
      polls = [...upcoming, ...completed]
    }
    const votes = polls.length
      ? await countVotes({ pollId: { in: polls.map(({ id }) => id) } })
      : []

    return {
      items: polls.map((poll) => toPollView(poll, votes)),
      total,
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
      request.getCurrentUser().catch((error: unknown) => {
        if (error instanceof UnauthorizedError) return null
        throw error
      }),
    ])
    const hasVoted = currentUser
      ? !!(await prisma.participations.findUnique({
          where: { pollId_userId: { pollId: poll.id, userId: currentUser.id } },
        }))
      : false

    return { ...toPollView(poll, votes), hasVoted }
  })

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
      const user = await request.requireRole('MANAGER', 'ADMIN')
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

      return reply.status(201).send({ id: poll.id, status: poll.status })
    }
  )

  // Só pautas agendadas podem ser editadas, e o título não muda depois de publicado.
  api.patch(
    '/polls/:id',
    { schema: { params: pollParams, body: pollBody } },
    async (request, reply) => {
      const user = await request.requireRole('MANAGER', 'ADMIN')
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

      return reply.status(204).send()
    }
  )
}
