import { MatchRequest } from '../models/MatchRequest'
import { Match } from '../models/Match'
import { ChatRoom } from '../models/ChatRoom'
import { ChatMessage } from '../models/ChatMessage'
import { User } from '../models/User'
import { Event } from '../models/Event'
import { ReliabilityLog } from '../models/ReliabilityLog'
import { notificationQueue } from '../config/queue'
import { calculateDaysUntilEvent } from '../utils/helpers'

export async function calculateScore(requestA: any, requestB: any, userB: any): number {
  let score = 0

  if (requestA.genderPreference === 'any' ||
      requestB.genderPreference === 'any' ||
      requestA.genderPreference === userB.gender) {
    score += 25
  }

  const overlapMin = Math.max(requestA.ageMin, requestB.ageMin)
  const overlapMax = Math.min(requestA.ageMax, requestB.ageMax)
  if (overlapMax >= overlapMin) {
    const overlapSize = overlapMax - overlapMin
    const maxPossible = Math.min(
      requestA.ageMax - requestA.ageMin,
      requestB.ageMax - requestB.ageMin
    )
    score += Math.round((overlapSize / maxPossible) * 25)
  }

  const commonTags = requestA.vibeTags
    .filter((tag: string) => requestB.vibeTags.includes(tag))
  score += Math.min(commonTags.length * 5, 25)

  const avgRating = (userB.ratingAvg || 3) / 5
  score += Math.round(avgRating * 15)

  if (userB.isVerified) score += 10

  return score
}

export async function runMatching(eventId: string) {
  const pendingRequests = await MatchRequest.find({
    eventId,
    status: 'pending'
  })

  if (pendingRequests.length < 2) {
    return
  }

  const event = await Event.findById(eventId)
  if (!event) return

  const daysUntilEvent = calculateDaysUntilEvent(event.date)

  let threshold = 35
  if (daysUntilEvent <= 5) threshold = 55
  else if (daysUntilEvent <= 3) threshold = 45

  const users = await User.find({
    _id: { $in: pendingRequests.map(r => r.userId) }
  })

  const userMap = new Map(users.map(u => [u._id.toString(), u]))

  const scoreMatrix: { [key: string]: { [key: string]: number } } = {}

  for (let i = 0; i < pendingRequests.length; i++) {
    for (let j = i + 1; j < pendingRequests.length; j++) {
      const requestA = pendingRequests[i]
      const requestB = pendingRequests[j]
      const userB = userMap.get(requestB.userId.toString())

      if (!userB) continue

      const score = await calculateScore(requestA, requestB, userB)
      const keyA = requestA._id.toString()
      const keyB = requestB._id.toString()

      if (!scoreMatrix[keyA]) scoreMatrix[keyA] = {}
      if (!scoreMatrix[keyB]) scoreMatrix[keyB] = {}

      scoreMatrix[keyA][keyB] = score
      scoreMatrix[keyB][keyA] = score
    }
  }

  const groups = findGroups(pendingRequests, scoreMatrix, threshold)

  for (const group of groups) {
    await createMatch(group, eventId, event.name)
  }

  const matchedRequestIds = groups.flat().map(r => r._id)
  const remainingRequests = pendingRequests.filter(r =>
    !matchedRequestIds.includes(r._id.toString())
  )

  const dayBeforeEvent = event.date.getTime() - 24 * 60 * 60 * 1000
  if (Date.now() > dayBeforeEvent) {
    for (const request of remainingRequests) {
      request.status = 'expired'
      await request.save()

      const user = userMap.get(request.userId.toString())
      if (user) {
        await notificationQueue.add('send-notification', {
          type: 'expired',
          data: {
            userId: user._id,
            eventName: event.name,
            eventId: event._id
          }
        })
      }
    }
  }
}

function findGroups(
  requests: any[],
  scoreMatrix: { [key: string]: { [key: string]: number } },
  threshold: number
): any[][] {
  const groups: any[][] = []
  const usedRequestIds = new Set<string>()

  for (let i = 0; i < requests.length; i++) {
    const requestId = requests[i]._id.toString()
    if (usedRequestIds.has(requestId)) continue

    const group = [requests[i]]
    usedRequestIds.add(requestId)

    const potentialMatches: { request: any; score: number }[] = []

    for (let j = 0; j < requests.length; j++) {
      if (i === j) continue
      const otherRequestId = requests[j]._id.toString()
      if (usedRequestIds.has(otherRequestId)) continue

      const score = scoreMatrix[requestId]?.[otherRequestId] || 0
      if (score >= threshold) {
        potentialMatches.push({ request: requests[j], score })
      }
    }

    potentialMatches.sort((a, b) => b.score - a.score)

    for (const { request } of potentialMatches) {
      if (group.length >= 4) break

      const otherRequestId = request._id.toString()
      const allScoresAboveThreshold = group.every(member => {
        const memberId = member._id.toString()
        const score = scoreMatrix[memberId]?.[otherRequestId] || 0
        return score >= threshold
      })

      if (allScoresAboveThreshold) {
        group.push(request)
        usedRequestIds.add(otherRequestId)
      }
    }

    if (group.length >= 2) {
      groups.push(group)
    } else {
      usedRequestIds.delete(requestId)
    }
  }

  return groups
}

async function createMatch(group: any[], eventId: string, eventName: string) {
  const memberIds = group.map(r => r.userId.toString())

  const chatRoom = new ChatRoom({
    eventId,
    matchId: null,
    memberIds,
    confirmationStatus: new Map(),
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
  })

  await chatRoom.save()

  const match = new Match({
    eventId,
    memberIds,
    chatRoomId: chatRoom._id,
    status: 'matched'
  })

  await match.save()
  chatRoom.matchId = match._id
  await chatRoom.save()

  const iceBreakerMessage = new ChatMessage({
    chatRoomId: chatRoom._id,
    senderId: 'system',
    type: 'system',
    systemMessageType: 'ice-breaker',
    content: `🎉 Your squad for ${eventName} is ready! Introduce yourselves and get excited!`,
    readBy: []
  })

  await iceBreakerMessage.save()

  for (const request of group) {
    request.status = 'matched'
    await request.save()

    await notificationQueue.add('send-notification', {
      type: 'match_found',
      data: {
        userId: request.userId,
        matchId: match._id,
        eventName
      }
    })
  }
}

export async function rematchGroup(chatRoomId: string) {
  const chatRoom = await ChatRoom.findById(chatRoomId)
  if (!chatRoom) return

  const match = await Match.findOne({ chatRoomId })
  if (!match) return

  const remainingMembers = chatRoom.memberIds

  if (remainingMembers.length < 2) {
    match.status = 'cancelled'
    await match.save()

    for (const userId of remainingMembers) {
      await notificationQueue.add('send-notification', {
        type: 'group_dissolved',
        data: { userId, eventId: chatRoom.eventId }
      })
    }
    return
  }

  const event = await Event.findById(chatRoom.eventId)
  if (!event) return

  const pendingRequests = await MatchRequest.find({
    eventId: chatRoom.eventId,
    status: 'pending',
    userId: { $nin: remainingMembers }
  }).populate('userId')

  const users = await User.find({ _id: { $in: pendingRequests.map(r => r.userId) } })
  const userMap = new Map(users.map(u => [u._id.toString(), u]))

  for (const request of pendingRequests) {
    const user = userMap.get(request.userId.toString())
    if (!user || user.blockedUsers.some((blockedId: string) => remainingMembers.includes(blockedId))) {
      continue
    }

    const allScores = remainingMembers.map(memberId => {
      const member = userMap.get(memberId)
      return member ? (member.ratingAvg || 3) : 0
    })

    const avgScore = allScores.reduce((sum, score) => sum + score, 0) / allScores.length

    if (avgScore >= 3) {
      await notificationQueue.add('send-notification', {
        type: 'replacement_offer',
        data: {
          userId: request.userId,
          matchId: match._id,
          eventName: event.name,
          groupSize: remainingMembers.length
        }
      })
    }
  }
}