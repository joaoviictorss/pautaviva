import type { PollStatus, Polls } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '../../lib/prisma.js'
import { BadRequestError } from './_errors/bad-request-error.js'
import { NotFoundError } from './_errors/not-found-error.js'

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

function resultCounts(votes: { option: 'FOR' | 'AGAINST' | 'ABSTAIN'; _count: number }[]) {
  const results = { FOR: 0, AGAINST: 0, ABSTAIN: 0 }
  for (const vote of votes) results[vote.option] = vote._count
  return results
}

export async function pollRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>()

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
      ? await prisma.votes.groupBy({
          by: ['pollId', 'option'],
          where: { pollId: { in: polls.map(({ id }) => id) } },
          _count: true,
        })
      : []

    const votesByPoll = new Map<string, { option: 'FOR' | 'AGAINST' | 'ABSTAIN'; _count: number }[]>()
    for (const vote of votes) {
      const current = votesByPoll.get(vote.pollId) ?? []
      current.push({ option: vote.option, _count: vote._count })
      votesByPoll.set(vote.pollId, current)
    }

    return {
      items: polls.map(({ _count, ...poll }) => {
        return {
          ...poll,
          status: statusOf(poll, now),
          participations: _count.participations,
          results: resultCounts(votesByPoll.get(poll.id) ?? []),
        }
      }),
      total,
      page: currentPage,
      pageSize,
    }
  })

  api.get('/polls/:id', { schema: { params: pollParams } }, async (request) => {
    const poll = await prisma.polls.findUnique({
      where: { id: request.params.id },
      select: {
        id: true,
        title: true,
        description: true,
        startsAt: true,
        endsAt: true,
        status: true,
        category: { select: { id: true, name: true } },
        _count: { select: { participations: true } },
      },
    })
    if (!poll) throw new NotFoundError('Pauta não encontrada.')

    const votes = await prisma.votes.groupBy({
      by: ['option'],
      where: { pollId: poll.id },
      _count: true,
    })

    const { _count, ...details } = poll
    return {
      ...details,
      status: statusOf(poll),
      participations: _count.participations,
      results: resultCounts(votes),
    }
  })

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
