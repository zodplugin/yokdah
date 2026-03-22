import { FastifyInstance } from 'fastify'
import { authenticate, requireAdmin } from '../middleware/auth'
import { Event } from '../models/Event'
import { MatchRequest } from '../models/MatchRequest'
import { uploadToR2 } from '../utils/storage'

export async function eventRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request: any) => {
    const { 
      city, 
      category, 
      name,
      status = 'active',
      startDate,
      endDate,
      page = 1,
      limit = 12
    } = request.query

    const query: any = { status }
    
    if (city) query.city = city
    if (category) query.category = category
    if (name) query.name = { $regex: name, $options: 'i' }
    if (startDate || endDate) {
      query.date = {}
      if (startDate) query.date.$gte = new Date(startDate)
      if (endDate) query.date.$lte = new Date(endDate)
    } else {
      query.date = { $gte: new Date() }
    }

    const total = await Event.countDocuments(query)
    const events = await Event.find(query)
      .sort({ date: 1 })
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .limit(parseInt(limit as string))

    const eventIds = events.map(e => e._id)
    const matchCounts = await MatchRequest.aggregate([
      { $match: { eventId: { $in: eventIds }, status: 'pending' } },
      { $group: { _id: '$eventId', count: { $sum: 1 } } }
    ])

    const countMap = new Map(matchCounts.map(m => [m._id.toString(), m.count]))

    const eventsWithCount = events.map(event => ({
      id: event._id,
      name: event.name,
      venue: event.venue,
      city: event.city,
      date: event.date,
      endTime: event.endTime,
      category: event.category,
      coverImage: event.coverImage,
      lookingCount: countMap.get(event._id.toString()) || 0
    }))

    return { 
      events: eventsWithCount,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total / parseInt(limit as string))
      }
    }
  })

  fastify.get('/cities', async () => {
    const cities = await Event.distinct('city', { status: 'active' })
    return { cities: cities.sort() }
  })

  fastify.get('/:eventId', async (request: any, reply) => {
    const { eventId } = request.params

    const event = await Event.findById(eventId)
    if (!event) {
      return reply.code(404).send({ error: 'Event not found' })
    }

    const lookingCount = await MatchRequest.countDocuments({
      eventId,
      status: 'pending'
    })

    return {
      id: event._id,
      name: event.name,
      venue: event.venue,
      city: event.city,
      date: event.date,
      endTime: event.endTime,
      category: event.category,
      description: event.description,
      coverImage: event.coverImage,
      ticketUrl: event.ticketUrl,
      lookingCount
    }
  })

  fastify.post('/', {
    onRequest: [requireAdmin]
  }, async (request: any, reply) => {
    const {
      name,
      venue,
      city,
      date,
      endTime,
      category,
      description,
      coverImage,
      ticketUrl
    } = request.body

    const event = new Event({
      name,
      venue,
      city,
      date,
      endTime,
      category,
      description,
      coverImage,
      ticketUrl,
      source: 'manual',
      sourceId: `manual-${Date.now()}`,
      status: 'active'
    })

    await event.save()

    return event
  })

  fastify.patch('/:eventId', {
    onRequest: [requireAdmin]
  }, async (request: any, reply) => {
    const { eventId } = request.params
    const updates = request.body

    const event = await Event.findByIdAndUpdate(
      eventId,
      { $set: updates },
      { new: true }
    )

    if (!event) {
      return reply.code(404).send({ error: 'Event not found' })
    }

    return event
  })

  fastify.post('/:eventId/status', {
    onRequest: [requireAdmin]
  }, async (request: any, reply) => {
    const { eventId } = request.params
    const { status } = request.body

    if (!['active', 'hidden'].includes(status)) {
      return reply.code(400).send({ error: 'Invalid status' })
    }

    const event = await Event.findByIdAndUpdate(
      eventId,
      { status },
      { new: true }
    )

    if (!event) {
      return reply.code(404).send({ error: 'Event not found' })
    }

    return event
  })
}