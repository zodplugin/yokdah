import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth'
import { Notification } from '../models/Notification'

export async function notificationRoutes(fastify: FastifyInstance) {
  fastify.get('/', {
    onRequest: [authenticate]
  }, async (request: any) => {
    const { unreadOnly = false, limit = 50 } = request.query

    const query: any = { userId: request.user.userId }
    if (unreadOnly === 'true') {
      query.isRead = false
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))

    return { notifications }
  })

  fastify.patch('/:notificationId/read', {
    onRequest: [authenticate]
  }, async (request: any, reply) => {
    const { notificationId } = request.params

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        userId: request.user.userId
      },
      { isRead: true },
      { new: true }
    )

    if (!notification) {
      return reply.code(404).send({ error: 'Notification not found' })
    }

    return notification
  })

  fastify.post('/read-all', {
    onRequest: [authenticate]
  }, async (request: any) => {
    await Notification.updateMany(
      { userId: request.user.userId, isRead: false },
      { isRead: true }
    )

    return { success: true }
  })

  fastify.get('/count', {
    onRequest: [authenticate]
  }, async (request: any) => {
    const unreadCount = await Notification.countDocuments({
      userId: request.user.userId,
      isRead: false
    })

    return { unreadCount }
  })
}