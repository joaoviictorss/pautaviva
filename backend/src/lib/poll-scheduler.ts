import type { FastifyInstance } from 'fastify'

import { emitToPoll } from '../http/sockets/index.js'
import { prisma } from './prisma.js'

const CHECK_INTERVAL_MS = 5_000

export function startPollClosureScheduler(app: FastifyInstance) {
  let running = false

  const closeExpiredPolls = async () => {
    if (running) return
    running = true
    try {
      const now = new Date()
      const expiredPolls = await prisma.polls.findMany({
        where: { status: { not: 'CLOSED' }, endsAt: { lte: now } },
        select: { id: true, endsAt: true },
      })

      for (const poll of expiredPolls) {
        const closed = await prisma.$transaction(async (transaction) => {
          const result = await transaction.polls.updateMany({
            where: { id: poll.id, status: { not: 'CLOSED' }, endsAt: { lte: now } },
            data: { status: 'CLOSED' },
          })
          if (result.count !== 1) return false

          await transaction.auditLogs.create({
            data: {
              action: 'POLL_CLOSED_AUTOMATICALLY',
              targetId: poll.id,
              details: { closedAt: now.toISOString(), endsAt: poll.endsAt.toISOString() },
            },
          })
          return true
        })
        if (closed) emitToPoll(poll.id, 'poll-closed', {})
      }
    } catch (error) {
      app.log.error({ err: error }, 'falha ao encerrar pautas vencidas; nova tentativa será feita')
    } finally {
      running = false
    }
  }

  const timer = setInterval(() => void closeExpiredPolls(), CHECK_INTERVAL_MS)
  timer.unref()
  void closeExpiredPolls()

  app.addHook('onClose', async () => {
    clearInterval(timer)
  })
}
