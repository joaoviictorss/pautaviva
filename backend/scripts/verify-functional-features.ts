import { randomUUID } from 'node:crypto'

import { hashPassword } from 'better-auth/crypto'

import { prisma } from '../src/lib/prisma.js'

const apiUrl = process.env.TEST_API_URL ?? 'http://127.0.0.1:3333'
const testPassword = `RequirementTest-${randomUUID()}`
const userIds: string[] = []
const pollIds: string[] = []
const commentIds: string[] = []

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

async function createUser(role: 'CITIZEN' | 'MANAGER' | 'MODERATOR') {
  const id = randomUUID()
  const email = `requirements-${id}@example.invalid`
  const user = await prisma.users.create({
    data: {
      id,
      name: `Requirement Test ${role}`,
      email,
      emailVerified: true,
      role,
      accounts: {
        create: {
          id: randomUUID(),
          accountId: id,
          providerId: 'credential',
          password: await hashPassword(testPassword),
        },
      },
    },
  })
  userIds.push(user.id)
  return { id: user.id, email }
}

async function signIn(email: string) {
  const response = await fetch(`${apiUrl}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
    body: JSON.stringify({ email, password: testPassword }),
  })
  const responseBody = await response.text()
  assert(response.ok, `Test sign-in failed (${response.status}): ${responseBody.slice(0, 200)}`)
  const cookie = response.headers
    .getSetCookie()
    .map((value) => value.split(';', 1)[0])
    .join('; ')
  assert(cookie.length > 0, 'Sign-in did not return a session cookie.')
  return cookie
}

async function request(path: string, cookie: string, body?: unknown) {
  return fetch(`${apiUrl}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      Cookie: cookie,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}

async function verify() {
  const category = await prisma.categories.findFirst({ select: { id: true } })
  assert(category, 'No category exists; seed the database before running this check.')

  const manager = await createUser('MANAGER')
  const author = await createUser('CITIZEN')
  const reporter = await createUser('CITIZEN')
  const secondReporter = await createUser('CITIZEN')
  const moderator = await createUser('MODERATOR')
  const managerCookie = await signIn(manager.email)
  const reporterCookie = await signIn(reporter.email)
  const secondReporterCookie = await signIn(secondReporter.email)
  const moderatorCookie = await signIn(moderator.email)
  const now = new Date()

  const poll = await prisma.polls.create({
    data: {
      title: 'Requirement export check',
      description: 'A pauta usada para validar exportação de resultados.',
      startsAt: new Date(now.getTime() - 3_600_000),
      endsAt: new Date(now.getTime() - 60_000),
      status: 'CLOSED',
      categoryId: category.id,
      createdById: manager.id,
    },
  })
  pollIds.push(poll.id)
  await prisma.participations.createMany({
    data: [
      { pollId: poll.id, userId: reporter.id },
      { pollId: poll.id, userId: secondReporter.id },
    ],
  })
  await prisma.votes.createMany({
    data: [
      { pollId: poll.id, option: 'FOR' },
      { pollId: poll.id, option: 'AGAINST' },
    ],
  })

  const retainedComment = await prisma.comments.create({
    data: {
      text: 'Comentário aprovado que deve permanecer publicado.',
      status: 'APPROVED',
      pollId: poll.id,
      authorId: author.id,
    },
  })
  const removedComment = await prisma.comments.create({
    data: {
      text: 'Comentário aprovado que deve ser removido após denúncia.',
      status: 'APPROVED',
      pollId: poll.id,
      authorId: author.id,
    },
  })
  const formulaComment = await prisma.comments.create({
    data: {
      text: '=SUM(1,1)',
      status: 'APPROVED',
      pollId: poll.id,
      authorId: author.id,
    },
  })
  commentIds.push(retainedComment.id, removedComment.id, formulaComment.id)

  const reportResponse = await request(`/comments/${retainedComment.id}/reports`, reporterCookie, {
    reason: 'SPAM',
  })
  assert(reportResponse.status === 201, `Comment report failed (${reportResponse.status}).`)

  const duplicateResponse = await request(`/comments/${retainedComment.id}/reports`, reporterCookie, {
    reason: 'SPAM',
  })
  assert(duplicateResponse.status === 409, `Duplicate report was not rejected (${duplicateResponse.status}).`)

  const moderationResponse = await request('/moderation/comments', moderatorCookie)
  assert(moderationResponse.ok, `Moderation queue failed (${moderationResponse.status}).`)
  const moderationQueue = (await moderationResponse.json()) as { id: string }[]
  assert(moderationQueue.some(({ id }) => id === retainedComment.id), 'Reported comment is missing from moderation.')

  const dismissResponse = await fetch(`${apiUrl}/moderation/comments/${retainedComment.id}`, {
    method: 'PATCH',
    headers: { Cookie: moderatorCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'DISMISS_REPORT' }),
  })
  assert(dismissResponse.status === 204, `Dismiss report failed (${dismissResponse.status}).`)

  const secondReport = await request(`/comments/${removedComment.id}/reports`, secondReporterCookie, {
    reason: 'OFFENSIVE_CONTENT',
  })
  assert(secondReport.status === 201, `Second comment report failed (${secondReport.status}).`)

  const removeResponse = await fetch(`${apiUrl}/moderation/comments/${removedComment.id}`, {
    method: 'PATCH',
    headers: { Cookie: moderatorCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'REMOVE' }),
  })
  assert(removeResponse.status === 204, `Removing reported comment failed (${removeResponse.status}).`)

  const publicCommentsResponse = await fetch(`${apiUrl}/polls/${poll.id}/comments`)
  assert(publicCommentsResponse.ok, 'Public comment list failed.')
  const publicComments = (await publicCommentsResponse.json()) as { id: string }[]
  assert(publicComments.some(({ id }) => id === retainedComment.id), 'Dismissed comment was not kept public.')
  assert(!publicComments.some(({ id }) => id === removedComment.id), 'Removed comment is still public.')

  const csvResponse = await request(`/polls/${poll.id}/export?format=csv`, managerCookie)
  assert(csvResponse.ok, `CSV export failed (${csvResponse.status}).`)
  const csv = await csvResponse.text()
  assert(csv.includes('50%') && csv.includes('Total de participantes'), 'CSV is missing final aggregate results.')
  assert(csv.includes(retainedComment.text), 'CSV is missing published comments.')
  assert(csv.includes("'=SUM(1,1)"), 'CSV did not neutralize a spreadsheet formula.')

  const pdfResponse = await request(`/polls/${poll.id}/export?format=pdf`, managerCookie)
  assert(pdfResponse.ok, `PDF export failed (${pdfResponse.status}).`)
  const pdfHeader = Buffer.from(await pdfResponse.arrayBuffer()).subarray(0, 5).toString()
  assert(pdfHeader === '%PDF-', 'PDF output has an invalid signature.')

  const scheduledPoll = await prisma.polls.create({
    data: {
      title: 'Requirement scheduled edit',
      description: 'A pauta usada para validar edição enquanto agendada.',
      startsAt: new Date(now.getTime() + 2 * 86_400_000),
      endsAt: new Date(now.getTime() + 4 * 86_400_000),
      status: 'SCHEDULED',
      categoryId: category.id,
      createdById: manager.id,
    },
  })
  pollIds.push(scheduledPoll.id)
  const editResponse = await fetch(`${apiUrl}/polls/${scheduledPoll.id}`, {
    method: 'PATCH',
    headers: { Cookie: managerCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Requirement scheduled edit updated',
      description: 'A pauta agendada foi editada para validar o fluxo.',
      categoryId: category.id,
      startsAt: new Date(now.getTime() + 3 * 86_400_000).toISOString(),
      endsAt: new Date(now.getTime() + 5 * 86_400_000).toISOString(),
    }),
  })
  assert(editResponse.status === 204, `Scheduled poll edit failed (${editResponse.status}).`)
  const editedPoll = await prisma.polls.findUnique({ where: { id: scheduledPoll.id }, select: { title: true } })
  assert(editedPoll?.title === 'Requirement scheduled edit updated', 'Scheduled poll title was not updated.')
  const prematureExport = await request(`/polls/${scheduledPoll.id}/export?format=csv`, managerCookie)
  assert(prematureExport.status === 400, 'Scheduled poll results were exportable before closure.')

  const openPoll = await prisma.polls.create({
    data: {
      title: 'Requirement closure check',
      description: 'A pauta usada para validar encerramento automático.',
      startsAt: new Date(now.getTime() - 3_600_000),
      endsAt: new Date(now.getTime() - 60_000),
      status: 'OPEN',
      categoryId: category.id,
      createdById: manager.id,
    },
  })
  pollIds.push(openPoll.id)
  await new Promise((resolve) => setTimeout(resolve, 6_000))
  const closedPoll = await prisma.polls.findUnique({ where: { id: openPoll.id }, select: { status: true } })
  assert(closedPoll?.status === 'CLOSED', 'Expired poll was not closed by the scheduler.')

  const healthResponse = await fetch(`${apiUrl}/health`)
  assert(healthResponse.status === 200, `Health endpoint failed (${healthResponse.status}).`)
  console.log('Report, moderation, CSV/PDF export, scheduled edits, automatic closure, and health checks passed.')
}

try {
  await verify()
} finally {
  await prisma.$transaction([
    prisma.auditLogs.deleteMany({
      where: {
        OR: [{ actorId: { in: userIds } }, { targetId: { in: [...pollIds, ...commentIds] } }],
      },
    }),
    prisma.polls.deleteMany({ where: { id: { in: pollIds } } }),
    prisma.users.deleteMany({ where: { id: { in: userIds } } }),
  ])
  await prisma.$disconnect()
}
