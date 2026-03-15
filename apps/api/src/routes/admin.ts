import { FastifyInstance } from 'fastify'
import { requireAdmin } from '../middleware/auth'
import { User } from '../models/User'
import { Event } from '../models/Event'
import { Report } from '../models/Report'
import { MatchRequest } from '../models/MatchRequest'
import { Match } from '../models/Match'
import { ChatRoom } from '../models/ChatRoom'

export async function adminRoutes(fastify: FastifyInstance) {
  fastify.get('/stats', {
    onRequest: [requireAdmin]
  }, async () => {
    const totalUsers = await User.countDocuments()
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })

    const totalEvents = await Event.countDocuments()
    const activeEvents = await Event.countDocuments({ status: 'active' })
    const pendingEvents = await Event.countDocuments({ status: 'pending_review' })

    const matchRequestsToday = await MatchRequest.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })

    const matchesToday = await Match.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })

    const activeChats = await ChatRoom.countDocuments({
      expiresAt: { $gt: new Date() }
    })

    const pendingReports = await Report.countDocuments({ status: 'pending' })

    const totalMatchRequests = await MatchRequest.countDocuments()
    const successRate = totalMatchRequests > 0 
      ? (matchesToday / totalMatchRequests) * 100 
      : 0

    return {
      users: {
        total: totalUsers,
        newToday: newUsersToday,
        newThisWeek: newUsersThisWeek
      },
      events: {
        total: totalEvents,
        active: activeEvents,
        pendingReview: pendingEvents
      },
      matches: {
        requestsToday: matchRequestsToday,
        formedToday: matchesToday,
        successRate: Math.round(successRate * 10) / 10
      },
      chats: {
        active: activeChats
      },
      reports: {
        pending: pendingReports
      }
    }
  })

  fastify.get('/events', {
    onRequest: [requireAdmin]
  }, async (request: any) => {
    const { status, city, category, page = 1, limit = 20 } = request.query

    const query: any = {}
    if (status) query.status = status
    if (city) query.city = city
    if (category) query.category = category

    const events = await Event.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const total = await Event.countDocuments(query)

    return { events, total, page, limit }
  })

  fastify.get('/events/:eventId', {
    onRequest: [requireAdmin]
  }, async (request: any, reply) => {
    const { eventId } = request.params

    const event = await Event.findById(eventId)
    if (!event) {
      return reply.code(404).send({ error: 'Event not found' })
    }

    const matchCount = await MatchRequest.countDocuments({ eventId })

    return { ...event.toObject(), matchCount }
  })

  fastify.get('/users', {
    onRequest: [requireAdmin]
  }, async (request: any) => {
    const { search, page = 1, limit = 20 } = request.query

    const query: any = {}
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } }
      ]
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const total = await User.countDocuments(query)

    return { users, total, page, limit }
  })

  fastify.get('/users/:userId', {
    onRequest: [requireAdmin]
  }, async (request: any, reply) => {
    const { userId } = request.params

    const user = await User.findById(userId)
    if (!user) {
      return reply.code(404).send({ error: 'User not found' })
    }

    const matchHistory = await Match.find({ memberIds: userId })
    const reportHistory = await Report.find({ $or: [{ reporterId: userId }, { reportedUserId: userId }] })

    return { ...user.toObject(), matchHistory, reportHistory }
  })

  fastify.patch('/users/:userId', {
    onRequest: [requireAdmin]
  }, async (request: any, reply) => {
    const { userId } = request.params
    const { action } = request.body

    const user = await User.findById(userId)
    if (!user) {
      return reply.code(404).send({ error: 'User not found' })
    }

    switch (action) {
      case 'warn':
        break
      case 'suspend':
        user.reliabilityScore = 0
        break
      case 'ban':
        user.reliabilityScore = 0
        break
      case 'unban':
        user.reliabilityScore = 30
        break
      case 'reset-score':
        user.reliabilityScore = 100
        break
      default:
        return reply.code(400).send({ error: 'Invalid action' })
    }

    await user.save()

    return { success: true, user }
  })

  fastify.get('/reports', {
    onRequest: [requireAdmin]
  }, async (request: any) => {
    const { status, page = 1, limit = 20 } = request.query

    const query: any = {}
    if (status) query.status = status

    const reports = await Report.find(query)
      .populate('reporterId', 'displayName email')
      .populate('reportedUserId', 'displayName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const total = await Report.countDocuments(query)

    return { reports, total, page, limit }
  })

  fastify.patch('/reports/:reportId', {
    onRequest: [requireAdmin]
  }, async (request: any, reply) => {
    const { reportId } = request.params
    const { status, adminNote } = request.body

    if (!['resolved', 'dismissed'].includes(status)) {
      return reply.code(400).send({ error: 'Invalid status' })
    }

    const report = await Report.findByIdAndUpdate(
      reportId,
      {
        status,
        adminNote,
        resolvedAt: new Date()
      },
      { new: true }
    )

    if (!report) {
      return reply.code(404).send({ error: 'Report not found' })
    }

    if (status === 'resolved' && adminNote?.includes('ban')) {
      await User.findByIdAndUpdate(report.reportedUserId, { reliabilityScore: 0 })
    }

    return report
  })
}