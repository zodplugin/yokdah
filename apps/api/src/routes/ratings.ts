import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth'
import { Rating } from '../models/Rating'
import { User } from '../models/User'
import { Match } from '../models/Match'

export async function ratingRoutes(fastify: FastifyInstance) {
  fastify.post('/:matchId', {
    onRequest: [authenticate]
  }, async (request: any, reply) => {
    const { matchId } = request.params
    const { ratings } = request.body

    if (!Array.isArray(ratings) || ratings.length === 0) {
      return reply.code(400).send({ error: 'Ratings array required' })
    }

    const match = await Match.findById(matchId)
    if (!match) {
      return reply.code(404).send({ error: 'Match not found' })
    }

    if (!match.memberIds.includes(request.user.userId)) {
      return reply.code(403).send({ error: 'Access denied' })
    }

    const createdRatings = []

    for (const rating of ratings) {
      const { ratedUserId, rating: score, note } = rating

      if (ratedUserId === request.user.userId) {
        continue
      }

      if (!match.memberIds.includes(ratedUserId)) {
        continue
      }

      const existingRating = await Rating.findOne({
        raterId: request.user.userId,
        matchId,
        ratedUserId
      })

      if (existingRating) {
        continue
      }

      const newRating = new Rating({
        raterId: request.user.userId,
        ratedUserId,
        matchId,
        eventId: match.eventId,
        rating: score,
        note
      })

      await newRating.save()
      createdRatings.push(newRating)

      await updateUserRating(ratedUserId)
    }

    return { ratings: createdRatings }
  })

  fastify.get('/match/:matchId', {
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

    const ratings = await Rating.find({
      raterId: request.user.userId,
      matchId
    })

    return { ratings }
  })
}

async function updateUserRating(userId: string) {
  const ratings = await Rating.find({ ratedUserId: userId })
  
  if (ratings.length === 0) return

  const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0)
  const avgRating = totalRating / ratings.length

  await User.findByIdAndUpdate(userId, {
    ratingAvg: avgRating,
    ratingCount: ratings.length
  })
}