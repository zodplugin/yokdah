import Redis from 'ioredis'
import { createAdapter } from '@socket.io/mongo-adapter'
import { Server as SocketIOServer } from 'socket.io'

export function setupSocket(fastify: any) {
  const httpServer = fastify.server
  let redisClient: Redis | null = null
  
  if (process.env.REDIS_URI && process.env.REDIS_URI !== 'disable') {
    try {
      redisClient = new Redis(process.env.REDIS_URI)
    } catch (error) {
      console.log('Redis connection failed for socket.io, running without it')
    }
  }

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true
    }
  })

  io.use(async (socket: any, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '')
      
      if (!token) {
        return next(new Error('Authentication error'))
      }

      const decoded = fastify.jwt.verify(token)
      socket.userId = decoded.userId
      next()
    } catch (error) {
      next(new Error('Authentication error'))
    }
  })

  io.on('connection', (socket: any) => {
    console.log(`User connected: ${socket.userId}`)

    socket.join(`user:${socket.userId}`)

    socket.on('join-chat', (chatId: string) => {
      socket.join(`chat:${chatId}`)
    })

    socket.on('leave-chat', (chatId: string) => {
      socket.leave(`chat:${chatId}`)
    })

    socket.on('send-message', async (data: { chatId: string; message: string }) => {
      socket.to(`chat:${data.chatId}`).emit('new-message', {
        chatId: data.chatId,
        message: data.message,
        senderId: socket.userId,
        timestamp: new Date()
      })
    })

    socket.on('typing-start', (data: { chatId: string }) => {
      socket.to(`chat:${data.chatId}`).emit('typing-start', {
        chatId: data.chatId,
        userId: socket.userId
      })
    })

    socket.on('typing-stop', (data: { chatId: string }) => {
      socket.to(`chat:${data.chatId}`).emit('typing-stop', {
        chatId: data.chatId,
        userId: socket.userId
      })
    })

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`)
    })
  })
}

export let io: any = null

export function setIO(server: any) {
  io = setupSocket(server)
}