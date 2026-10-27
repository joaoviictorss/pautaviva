import type { FastifyInstance } from 'fastify'
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod'

import { BadRequestError } from './routes/_errors/bad-request-error.js'
import { ConflictError } from './routes/_errors/conflict-error.js'
import { ForbiddenError } from './routes/_errors/forbidden-error.js'
import { UnauthorizedError } from './routes/_errors/unauthorized-error.js'

type FastifyErrorHandler = FastifyInstance['errorHandler']

export const errorHandler: FastifyErrorHandler = (error, request, reply) => {
  if (hasZodFastifySchemaValidationErrors(error)) {
    const fieldErrors: Record<string, string[]> = {}

    for (const issue of error.validation) {
      const field = issue.instancePath.replace(/^\//, '') || 'root'
      fieldErrors[field] ??= []
      fieldErrors[field].push(issue.message ?? 'Invalid value')
    }

    return reply.status(400).send({
      message: 'Validation error',
      errors: fieldErrors,
    })
  }

  if (error instanceof BadRequestError) {
    return reply.status(400).send({ message: error.message })
  }

  if (error instanceof UnauthorizedError) {
    return reply.status(401).send({ message: error.message })
  }

  if (error instanceof ForbiddenError) {
    return reply.status(403).send({ message: error.message })
  }

  if (error instanceof ConflictError) {
    return reply.status(409).send({ message: error.message })
  }

  console.error(error)

  // TODO: send error to an observability service

  return reply.status(500).send({ message: 'Internal server error' })
}
