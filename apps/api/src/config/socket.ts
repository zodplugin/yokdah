import Redis from 'ioredis'
import { createAdapter } from '@socket.io/mongo-adapter'
import { Server as SocketIOServer } from 'socket.io'
import mongoose from 'mongoose'

export let io: any = null
const activeUsers = new Map<string, number>()

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

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true
    }
  })

  io.use(async (socket: any, next: (err?: Error) => void) => {
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

    const userId = socket.userId
    const currentCount = activeUsers.get(userId) || 0
    activeUsers.set(userId, currentCount + 1)

    if (currentCount === 0) {
      io.emit('user-presence', { userId, online: true })
    }

    // Send the list of currently online users to the newly connected user
    socket.emit('online-users', Array.from(activeUsers.keys()))

    socket.join(`user:${socket.userId}`)

    socket.on('join-chat', (chatId: string) => {
      socket.join(`chat:${chatId}`)
    })

    socket.on('leave-chat', (chatId: string) => {
      socket.leave(`chat:${chatId}`)
    })

    socket.on('send-message', async (data: { chatId: string; message: string; photoUrl?: string; replyTo?: any; _id?: string }) => {
      const payload = {
        _id: data._id,
        chatId: data.chatId,
        message: data.message,
        photoUrl: data.photoUrl,
        replyTo: data.replyTo,
        type: data.photoUrl ? 'photo' : 'text',
        senderId: socket.userId,
        timestamp: new Date()
      };

      // Emit to active room
      socket.to(`chat:${data.chatId}`).emit('new-message', payload)

      // Emit to individual users for global notifications
      try {
        const ChatRoom = mongoose.model('ChatRoom');
        const User = mongoose.model('User');
        const Match = mongoose.model('Match');
        const Event = mongoose.model('Event');

        const chatRoom = await ChatRoom.findById(data.chatId);
        if (chatRoom) {
          const match = await Match.findOne({ chatRoomId: data.chatId });
          const event = match ? await Event.findById(match.eventId) : null;
          const sender = await User.findById(socket.userId);

          const richPayload = {
            ...payload,
            senderName: sender?.displayName?.split(' ')[0] || 'Someone',
            eventName: event?.name || 'Squad',
            matchId: match?._id || ''
          };

          chatRoom.memberIds.forEach((memberId: string) => {
            if (memberId !== socket.userId) {
              socket.to(`user:${memberId}`).emit('global-new-message', richPayload);
            }
          });
        }
      } catch (err) {
        console.error("Failed to emit global notification", err);
      }
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
      const userId = socket.userId
      const newCount = (activeUsers.get(userId) || 1) - 1
      
      if (newCount <= 0) {
        activeUsers.delete(userId)
        io.emit('user-presence', { userId, online: false })
      } else {
        activeUsers.set(userId, newCount)
      }
    })
  })

  return io
}

export function setIO(server: any) {
  // io is already set inside setupSocket
}