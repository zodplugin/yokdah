import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth'
import { MatchRequest } from '../models/MatchRequest'
import { Match } from '../models/Match'
import { ChatRoom } from '../models/ChatRoom'
import { ChatMessage } from '../models/ChatMessage'
import { Event } from '../models/Event'
import { User } from '../models/User'
import { matchQueue, addMatchJob } from '../config/queue'
import { calculateDaysUntilEvent } from '../utils/helpers'
import { calculateScore } from '../services/matchingService'
import mongoose from 'mongoose' 

export async function matchRoutes(fastify: FastifyInstance) {
  fastify.post('/request', {
    onRequest: [authenticate]
  }, async (request: any, reply) => {
    const { eventId, groupSize, genderPreference, ageMin, ageMax, vibeTags } = request.body
    const userId = request.user.userId

    console.log(`User Id : ${userId}`)

    const existingRequest = await MatchRequest.findOne({
      userId,
      eventId,
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

    await addMatchJob(eventId)

    return {
      id: matchRequest._id,
      status: matchRequest.status,
      message: 'Your request has been submitted. We\'ll find your squad soon!'
    }
  })

  fastify.get('/requests', {
    onRequest: [authenticate]
  }, async (request: any) => {
    const { status, limit = 10, page = 1 } = request.query
    const skip = (parseInt(limit as string) * (parseInt(page as string) - 1))

    const userId = String(request.user.userId)
    const query: any = { userId }

    if (status) {
      const statusArray = (status as string).split(',')
      query.status = { $in: statusArray }
    }

    const total = await MatchRequest.countDocuments(query)
    const requests = await MatchRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string))
      .populate({ path: 'eventId', model: 'Event', select: 'name venue date category coverImage' })
      .lean()

    const enrichedRequests = await Promise.all(requests.map(async (req: any) => {
      if (!req.eventId) return null;

      if (req.status === 'matched' || req.status === 'confirmed') {
        const eventIdStr = typeof req.eventId === 'string' ? req.eventId : String(req.eventId._id || req.eventId);
        const match = await Match.findOne({
          eventId: eventIdStr,
          memberIds: userId,
          status: { $in: ['matched', 'confirmed'] }
        }).lean();

        let members: any[] = [];
        let unreadCount = 0;
        let chatRoomId = null;

        if (match) {
          chatRoomId = String(match._id); // In our system, matchId is often reused or linked
          const chatRoom = await ChatRoom.findOne({ matchId: match._id });
          if (chatRoom) {
            chatRoomId = String(chatRoom._id);
            const lastRead = chatRoom.lastRead ? (chatRoom.lastRead.get(userId) || new Date(0)) : new Date(0);
            unreadCount = await ChatMessage.countDocuments({
              chatRoomId: chatRoom._id,
              senderId: { $ne: userId },
              createdAt: { $gt: lastRead }
            });
          }

          if (match.memberIds) {
            const userDocs = await User.find({ _id: { $in: match.memberIds } }, 'displayName photo reliabilityScore').lean();
            members = userDocs.map(m => ({
              id: m._id,
              displayName: m.displayName,
              photo: m.photo,
              reliabilityScore: m.reliabilityScore
            }));
          }
        }

        return {
          ...req,
          matchId: match?._id,
          chatRoomId,
          unreadCount,
          members
        };
      }
      return req;
    }));

    return { 
      requests: enrichedRequests.filter(Boolean),
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total / parseInt(limit as string))
      }
    }
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
      pinnedMessageId: chatRoom?.pinnedMessageId,
      status: match.status
    }
  })

  fastify.delete('/requests/:requestId', {
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