import type { FastifyInstance } from 'fastify'

import { env } from '../env.js'
import { emitLive } from '../http/sockets/index.js'
import { sendNoticeMail, sendPollOpenedMail } from './mail.js'
import { prisma } from './prisma.js'

const CHECK_INTERVAL_MS = 5_000
const CLOSING_NOTICE_MS = 24 * 60 * 60 * 1000

export function startPollClosureScheduler(app: FastifyInstance) {
  let running = false

  // shortcut: envia um a um no processo da API; com muitos inscritos, mover para uma fila
  const notifyUsers = async (users: { name: string; email: string }[], notice: Parameters<typeof sendNoticeMail>[2]) => {
    for (const { name, email } of users) {
      await sendNoticeMail(email, name, notice).catch((error: unknown) =>
        app.log.error({ err: error }, 'falha ao enviar notificação de pauta'),
      )
    }
  }

  const notifyResult = async (pollId: string) => {
    const poll = await prisma.polls.findUnique({ where: { id: pollId }, select: { title: true } })
    if (!poll) return
    const voters = await prisma.users.findMany({
      where: { notifyPollResult: true, participations: { some: { pollId } } },
      select: { name: true, email: true },
    })
    await notifyUsers(voters, {
      subject: `Resultado publicado: ${poll.title}`,
      intro: `A votação de "${poll.title}", em que você participou, foi encerrada e o resultado já está disponível.`,
      action: 'Ver resultado',
      url: `${env.CORS_ORIGIN}/pautas/${pollId}`,
    })
  }

  const notifyPollMilestones = async () => {
    try {
      const now = new Date()
      const opened = await prisma.polls.findMany({
        where: { openNoticeSentAt: null, status: { not: 'CLOSED' }, startsAt: { lte: now }, endsAt: { gt: now } },
        select: { id: true, title: true },
      })
      for (const poll of opened) {
        const claimed = await prisma.polls.updateMany({ where: { id: poll.id, openNoticeSentAt: null }, data: { openNoticeSentAt: now } })
        if (claimed.count !== 1) continue
        emitLive('polls-changed', { pollId: poll.id })
        const users = await prisma.users.findMany({
          where: { role: 'CITIZEN', notifyPollOpened: true },
          select: { name: true, email: true },
        })
        await notifyUsers(users, {
          subject: `Nova pauta aberta: ${poll.title}`,
          intro: `A pauta "${poll.title}" já está aberta para votação.`,
          action: 'Votar agora',
          url: `${env.CORS_ORIGIN}/pautas/${poll.id}`,
        })
      }

      const closing = await prisma.polls.findMany({
        where: {
          closingNoticeSentAt: null,
          status: { not: 'CLOSED' },
          startsAt: { lte: now },
          endsAt: { gt: now, lte: new Date(now.getTime() + CLOSING_NOTICE_MS) },
        },
        select: { id: true, title: true },
      })
      for (const poll of closing) {
        const claimed = await prisma.polls.updateMany({ where: { id: poll.id, closingNoticeSentAt: null }, data: { closingNoticeSentAt: now } })
        if (claimed.count !== 1) continue
        const users = await prisma.users.findMany({
          where: { role: 'CITIZEN', notifyPollClosing: true, participations: { none: { pollId: poll.id } } },
          select: { name: true, email: true },
        })
        await notifyUsers(users, {
          subject: `Votação encerrando: ${poll.title}`,
          intro: `A votação de "${poll.title}" termina em menos de 24 horas e você ainda não votou.`,
          action: 'Votar agora',
          url: `${env.CORS_ORIGIN}/pautas/${poll.id}`,
        })
      }
    } catch (error) {
      app.log.error({ err: error }, 'falha ao processar notificações de pautas; nova tentativa será feita')
    }
  }

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
        if (closed) {
          emitLive('polls-changed', { pollId: poll.id })
          void notifyResult(poll.id).catch((error: unknown) =>
            app.log.error({ err: error, pollId: poll.id }, 'falha ao notificar resultado da pauta'),
          )
        }
      }
    } catch (error) {
      app.log.error({ err: error }, 'falha ao encerrar pautas vencidas; nova tentativa será feita')
    } finally {
      running = false
    }
  }

  const notifyOpenedPolls = async () => {
    try {
      const now = new Date()
      const reminders = await prisma.pollReminders.findMany({
        where: { notifiedAt: null, poll: { status: { not: 'CLOSED' }, startsAt: { lte: now }, endsAt: { gt: now } } },
        select: { id: true, poll: { select: { id: true, title: true } }, user: { select: { name: true, email: true } } },
      })

      for (const { id, poll, user } of reminders) {
        // marca antes de enviar: se o e-mail falhar, a pessoa perde o aviso, mas nunca recebe em dobro
        const claimed = await prisma.pollReminders.updateMany({ where: { id, notifiedAt: null }, data: { notifiedAt: now } })
        if (claimed.count !== 1) continue
        await sendPollOpenedMail(user.email, user.name, poll.title, `${env.CORS_ORIGIN}/pautas/${poll.id}`).catch((error: unknown) =>
          app.log.error({ err: error, reminderId: id }, 'falha ao enviar lembrete de abertura de pauta'),
        )
      }
    } catch (error) {
      app.log.error({ err: error }, 'falha ao processar lembretes; nova tentativa será feita')
    }
  }

  const tick = () => {
    void closeExpiredPolls()
    void notifyOpenedPolls()
    void notifyPollMilestones()
  }

  const timer = setInterval(tick, CHECK_INTERVAL_MS)
  timer.unref()
  tick()

  app.addHook('onClose', async () => {
    clearInterval(timer)
  })
}
