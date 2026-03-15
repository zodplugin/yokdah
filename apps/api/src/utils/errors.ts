import { ZodError } from 'zod'
import { FastifyError, FastifyRequest, FastifyReply } from 'fastify'

export async function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  request.log.error(error)

  if (error instanceof ZodError) {
    return reply.code(400).send({
      error: 'Validation Error',
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    })
  }

  if (error.validation) {
    return reply.code(400).send({
      error: 'Validation Error',
      details: error.validation
    })
  }

  if (error.statusCode) {
    return reply.code(error.statusCode).send({
      error: error.message
    })
  }

  reply.code(500).send({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
  })
}

export function createNotFoundError(resource: string = 'Resource') {
  return {
    statusCode: 404,
    message: `${resource} not found`
  }
}

export function createBadRequestError(message: string) {
  return {
    statusCode: 400,
    message
  }
}

export function createUnauthorizedError(message: string = 'Unauthorized') {
  return {
    statusCode: 401,
    message
  }
}

export function createForbiddenError(message: string = 'Forbidden') {
  return {
    statusCode: 403,
    message
  }
}

export function createConflictError(message: string) {
  return {
    statusCode: 409,
    message
  }
}