import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import staticFiles from '@fastify/static'
import * as path from 'path'
import { connectDatabase } from './config/database'
import { setupSocket } from './config/socket'
import { setupQueue } from './config/queue'
import { setupScheduledJobs } from './jobs/scheduler'
import { errorHandler } from './utils/errors'
import { authRoutes } from './routes/auth'
import { userRoutes } from './routes/users'
import { eventRoutes } from './routes/events'
import { matchRoutes } from './routes/matches'
import { chatRoutes } from './routes/chats'
import { ratingRoutes } from './routes/ratings'
import { notificationRoutes } from './routes/notifications'
import { reportRoutes } from './routes/reports'
import { adminRoutes } from './routes/admin'
import { uploadRoutes } from './routes/upload'

const fastify = Fastify({
  logger: true
})

const PORT = parseInt(process.env.PORT || '3001')

async function start() {
  try {
    fastify.setErrorHandler(errorHandler)

    await fastify.register(cors, {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true
    })

    await fastify.register(jwt, {
      secret: process.env.JWT_SECRET || 'your-secret-key'
    })

    await fastify.register(multipart, {
      limits: {
        fileSize: 10 * 1024 * 1024
      }
    })

    await fastify.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute'
    })

    if (process.env.STORAGE_PROVIDER === 'local') {
      const uploadPath = process.env.UPLOAD_PATH || './uploads'
      await fastify.register(staticFiles, {
        root: path.resolve(uploadPath),
        prefix: '/uploads/',
        decorateReply: false
      })
    }

    await fastify.register(swagger, {
      openapi: {
        info: {
          title: 'Fomoin API',
          description: 'Event Buddy Matching Platform API',
          version: '1.0.0'
        },
        servers: [
          {
            url: 'http://localhost:3001',
            description: 'Development server'
          }
        ],
        components: {
          securitySchemes: {
            bearer: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT'
            }
          }
        }
      },
      security: [{ bearer: [] }]
    })

    await fastify.register(swaggerUI, {
      routePrefix: '/docs'
    })

    await connectDatabase()

    setupQueue()
    setupScheduledJobs()

    fastify.register(authRoutes, { prefix: '/api/auth' })
    fastify.register(userRoutes, { prefix: '/api/users' })
    fastify.register(eventRoutes, { prefix: '/api/events' })
    fastify.register(matchRoutes, { prefix: '/api/matches' })
    fastify.register(chatRoutes, { prefix: '/api/chats' })
    fastify.register(ratingRoutes, { prefix: '/api/ratings' })
    fastify.register(notificationRoutes, { prefix: '/api/notifications' })
    fastify.register(reportRoutes, { prefix: '/api/reports' })
    fastify.register(adminRoutes, { prefix: '/api/admin' })
    fastify.register(uploadRoutes, { prefix: '/api' })

    fastify.get('/health', async (request, reply) => {
      return { status: 'ok', timestamp: new Date().toISOString() }
    })

    await fastify.listen({ port: PORT, host: '0.0.0.0' })
    
    const server = fastify.server
    setupSocket(fastify)
    
    fastify.log.info(`Server running on http://localhost:${PORT}`)
  } catch (error) {
    fastify.log.error(error)
    process.exit(1)
  }
}

start()