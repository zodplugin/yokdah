import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth'
import { Report } from '../models/Report'
import { User } from '../models/User'

export async function reportRoutes(fastify: FastifyInstance) {
  fastify.post('/', {
    onRequest: [authenticate]
  }, async (request: any, reply) => {
    const { reportedUserId, category, detail, screenshotUrl, chatRoomId } = request.body

    if (!reportedUserId || !category) {
      return reply.code(400).send({ error: 'reportedUserId and category required' })
    }

    if (request.user.userId === reportedUserId) {
      return reply.code(400).send({ error: 'Cannot report yourself' })
    }

    const reportedUser = await User.findById(reportedUserId)
    if (!reportedUser) {
      return reply.code(404).send({ error: 'User not found' })
    }

    const report = new Report({
      reporterId: request.user.userId,
      reportedUserId,
      category,
      detail,
      screenshotUrl,
      chatRoomId,
      status: 'pending'
    })

    await report.save()

    const recentReports = await Report.countDocuments({
      reportedUserId,
      status: 'pending',
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    })

    if (recentReports >= 3) {
      reportedUser.role = 'user'
      await reportedUser.save()
    }

    return { id: report._id, status: report.status }
  })
}