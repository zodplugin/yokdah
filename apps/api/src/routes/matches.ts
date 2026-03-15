import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth'
import { MatchRequest } from '../models/MatchRequest'
import { Match } from '../models/Match'
import { ChatRoom } from '../models/ChatRoom'
import { ChatMessage } from '../models/ChatMessage'
import { Event } from '../models/Event'
import { User } from '../models/User'
import { matchQueue } from '../config/queue'
import { calculateDaysUntilEvent } from '../utils/helpers'
import { calculateScore } from '../services/matchingService'

export async function matchRoutes(fastify: FastifyInstance) {
  fastify.post('/request', {
    onRequest: [authenticate]
  }, async (request: any, reply) => {
    const { eventId, groupSize, genderPreference, ageMin, ageMax, vibeTags } = request.body
    const userId = request.user.userId

    const existingRequest = await MatchRequest.findOne({
      userId,
      eventId,
      status: { $in: ['pending', 'matched', 'confirmed'] }
    })

    if (existingRequest) {
      return reply.code(400).send({ error: 'You already have an active request for this event' })
    }

    const user = await User.findById(userId)
    if (!user) {
      return reply.code(404).send({ error: 'User not found' })
    }

    const event = await Event.findById(eventId)
    if (!event) {
      return reply.code(404).send({ error: 'Event not found' })
    }

    if (user.reliabilityScore < 20) {
      return reply.code(403).send({ error: 'Your account is temporarily locked' })
    }

    const matchRequest = new MatchRequest({
      userId,
      eventId,
      groupSize,
      genderPreference: genderPreference || user.genderPreference,
      ageMin: ageMin || user.ageMin,
      ageMax: ageMax || user.ageMax,
      vibeTags: vibeTags || user.vibeTags,
      status: 'pending',
      priority: false
    })

    await matchRequest.save()

    await matchQueue.add('run-matching', { eventId }, {
      delay: 30000,
      jobId: `match-${eventId}-${Date.now()}`
    })

    return {
      id: matchRequest._id,
      status: matchRequest.status,
      message: 'Your request has been submitted. We\'ll find your squad soon!'
    }
  })

  fastify.get('/requests', {
    onRequest: [authenticate]
  }, async (request: any) => {
    const { status } = request.query

    const query: any = { userId: request.user.userId }
    if (status) query.status = status

    const requests = await MatchRequest.find(query)
      .sort({ createdAt: -1 })
      .populate('eventId', 'name venue date category coverImage')
      .lean()

    return { requests }
  })

  fastify.get('/:matchId', {
    onRequest: [authenticate]
  }, async (request: any, reply) => {
    const { matchId } = request.params

    const match = await Match.findById(matchId)
    if (!match) {
      return reply.code(404).send({ error: 'Match not found' })
    }

    if (!match.memberIds.includes(request.user.userId)) {
      return reply.code(403).send({ error: 'Access denied' })
    }

    const chatRoom = await ChatRoom.findOne({ matchId })
    const event = await Event.findById(match.eventId)
    const members = await User.find({ _id: { $in: match.memberIds } })

    return {
      id: match._id,
      event,
      members: members.map(m => ({
        id: m._id,
        displayName: m.displayName,
        photo: m.photo,
        reliabilityScore: m.reliabilityScore
      })),
      chatRoomId: match.chatRoomId,
      confirmationStatus: chatRoom?.confirmationStatus || {},
      status: match.status
    }
  })

  fastify.delete('/:requestId', {
    onRequest: [authenticate]
  }, async (request: any, reply) => {
    const { requestId } = request.params

    const matchRequest = await MatchRequest.findOne({
      _id: requestId,
      userId: request.user.userId
    })

    if (!matchRequest) {
      return reply.code(404).send({ error: 'Request not found' })
    }

    if (matchRequest.status !== 'pending') {
      return reply.code(400).send({ error: 'Can only cancel pending requests' })
    }

    matchRequest.status = 'cancelled'
    await matchRequest.save()

    return { success: true }
  })
}