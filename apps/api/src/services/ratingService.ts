import { Rating } from '../models/Rating'
import { User } from '../models/User'
import { Match } from '../models/Match'
import { ReliabilityLog } from '../models/ReliabilityLog'
import { updateReliabilityScore } from './reliabilityService'

export async function sendRatingRequests() {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const completedMatches = await Match.find({
    status: 'completed',
    updatedAt: { $gte: yesterday }
  })

  for (const match of completedMatches) {
    const event = await Match.findById(match.eventId)
    if (!event) continue

    for (const memberId of match.memberIds) {
      await sendRatingRequestForMember(memberId, match._id, event.name)
    }
  }
}

async function sendRatingRequestForMember(userId: string, matchId: string, eventName: string) {
  const { notificationQueue } = await import('../config/queue')
  
  await notificationQueue.add('send-notification', {
    type: 'rating_request',
    data: {
      userId,
      matchId,
      eventName
    }
  })
}

export async function processRating(userId: string, ratedUserId: string, rating: number, matchId: string) {
  if (rating >= 4) {
    await updateReliabilityScore(
      ratedUserId,
      'rated-positive',
      3,
      'Received positive rating',
      undefined,
      matchId
    )
  }

  await updateUserRating(ratedUserId)

  await checkTrustedBadge(ratedUserId)
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

async function checkTrustedBadge(userId: string) {
  const user = await User.findById(userId)
  if (!user) return

  if (user.ratingCount >= 3 && user.ratingAvg >= 4.0) {
    if (!user.isVerified) {
      user.isVerified = true
      await user.save()
    }
  }
}