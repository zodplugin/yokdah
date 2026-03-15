import { User } from '../models/User'
import { ReliabilityLog } from '../models/ReliabilityLog'

export async function updateReliabilityScore(
  userId: string,
  type: string,
  points: number,
  description: string,
  eventId?: string,
  matchId?: string
) {
  const user = await User.findById(userId)
  if (!user) return

  let newScore = user.reliabilityScore + points
  newScore = Math.max(0, Math.min(100, newScore))

  user.reliabilityScore = newScore
  await user.save()

  await ReliabilityLog.create({
    userId,
    type: type as any,
    points,
    description,
    eventId,
    matchId
  })

  if (newScore < 40 && type !== 'no-incident') {
    const { notificationQueue } = await import('../config/queue')
    await notificationQueue.add('send-notification', {
      type: 'reliability_warn',
      data: { userId }
    })
  }

  return newScore
}

export async function checkMonthlyNoIncidentBonus() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const users = await User.find({
    reliabilityScore: { $gte: 80 }
  })

  for (const user of users) {
    const recentLogs = await ReliabilityLog.countDocuments({
      userId: user._id,
      createdAt: { $gte: thirtyDaysAgo },
      type: { $in: ['ghost', 'late-cancel', 'kicked', 'no-show'] }
    })

    if (recentLogs === 0) {
      const lastBonus = await ReliabilityLog.findOne({
        userId: user._id,
        type: 'no-incident'
      }).sort({ createdAt: -1 })

      if (!lastBonus || lastBonus.createdAt < thirtyDaysAgo) {
        await updateReliabilityScore(
          user._id,
          'no-incident',
          5,
          '30 days without incidents',
          undefined,
          undefined
        )
      }
    }
  }
}