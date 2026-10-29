import { env } from '../env.js'
import { hashCpf, isValidCpf } from '../utils/cpf.js'
import { prisma } from './prisma.js'

export async function protectStoredCpfs() {
  const users = await prisma.users.findMany({
    where: { cpf: { not: null } },
    select: { id: true, cpf: true },
  })

  for (const user of users) {
    if (!user.cpf || !isValidCpf(user.cpf)) continue
    await prisma.users.updateMany({
      where: { id: user.id, cpf: user.cpf },
      data: { cpf: hashCpf(user.cpf, env.BETTER_AUTH_SECRET) },
    })
  }
}
