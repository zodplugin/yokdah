import { MatchRequest } from '../models/MatchRequest'
import { Match } from '../models/Match'
import { ChatRoom } from '../models/ChatRoom'
import { ChatMessage } from '../models/ChatMessage'
import { User } from '../models/User'
import { Event } from '../models/Event'
import { ReliabilityLog } from '../models/ReliabilityLog'
import { notificationQueue } from '../config/queue'
import { calculateDaysUntilEvent } from '../utils/helpers'

// ─── Score ────────────────────────────────────────────────────────────────────

export async function calculateScore(requestA: any, requestB: any, userA: any, userB: any): Promise<number> {
  let score = 0

  // Bidirectional gender check: both users must be acceptable to each other
  const aAcceptsB = requestA.genderPreference === 'any' || requestA.genderPreference === userB.gender
  const bAcceptsA = requestB.genderPreference === 'any' || requestB.genderPreference === userA.gender
  if (aAcceptsB && bAcceptsA) {
    score += 25
  } else if (aAcceptsB || bAcceptsA) {
    score += 12
  }

  const overlapMin = Math.max(requestA.ageMin, requestB.ageMin)
  const overlapMax = Math.min(requestA.ageMax, requestB.ageMax)
  if (overlapMax >= overlapMin) {
    const overlapSize = overlapMax - overlapMin
    const maxPossible = Math.min(
      requestA.ageMax - requestA.ageMin,
      requestB.ageMax - requestB.ageMin
    )
    score += maxPossible > 0 ? Math.round((overlapSize / maxPossible) * 25) : 25
  }

  const commonTags = requestA.vibeTags.filter((tag: string) => requestB.vibeTags.includes(tag))
  score += Math.min(commonTags.length * 5, 25)

  const avgRating = (userB.ratingAvg || 3) / 5
  score += Math.round(avgRating * 15)

  if (userB.isVerified) score += 10

  console.log('🧠 SCORE:', { A: requestA.userId, B: requestB.userId, score })
  return score
}

// ─── Main Matching ────────────────────────────────────────────────────────────

export async function runMatching(eventId: string) {
  // FIX RACE CONDITION: Atomic claim via MongoDB updateMany.
  //
  // Kenapa Redis lock tidak efektif di sini:
  //   Semua job (1, 2, 3) start hampir bersamaan. Job 1 SET lock, tapi
  //   job 2 & 3 sudah terlanjur lolos SEBELUM lock di-set karena async gap.
  //
  // Solusi — atomic status flip 'pending' → 'processing':
  //   Semua job coba updateMany bersamaan.
  //   MongoDB menjamin hanya 1 yang dapat modifiedCount >= 2.
  //   Job lainnya dapat 0 dan langsung skip.

  const claimResult = await MatchRequest.updateMany(
    { eventId, status: 'pending' },
    { $set: { status: 'processing' } }
  )

  const claimedCount = claimResult.modifiedCount

  if (claimedCount < 2) {
    // Rollback kalau hanya dapat 1 (tidak cukup untuk matching)
    if (claimedCount > 0) {
      await MatchRequest.updateMany(
        { eventId, status: 'processing' },
        { $set: { status: 'pending' } }
      )
    }
    console.log(`⏭ Skipping event ${eventId}: only claimed ${claimedCount} request(s)`)
    return
  }

  console.log(`🔒 Claimed ${claimedCount} requests for event ${eventId}`)

  try {
    const processingRequests = await MatchRequest.find({ eventId, status: 'processing' })

    const event = await Event.findById(eventId)
    if (!event) {
      await MatchRequest.updateMany(
        { eventId, status: 'processing' },
        { $set: { status: 'pending' } }
      )
      return
    }

    const daysUntilEvent = calculateDaysUntilEvent(event.date)

    let threshold = 20
    if (daysUntilEvent <= 3) threshold = 40
    else if (daysUntilEvent <= 5) threshold = 30

    const users = await User.find({ _id: { $in: processingRequests.map((r) => r.userId) } })
    const userMap = new Map(users.map((u) => [u._id.toString(), u]))

    // Build score matrix
    const scoreMatrix: { [key: string]: { [key: string]: number } } = {}

    for (let i = 0; i < processingRequests.length; i++) {
      for (let j = i + 1; j < processingRequests.length; j++) {
        const requestA = processingRequests[i]
        const requestB = processingRequests[j]
        const userA = userMap.get(requestA.userId.toString())
        const userB = userMap.get(requestB.userId.toString())

        if (!userA || !userB) continue

        const score = await calculateScore(requestA, requestB, userA, userB)
        const keyA = requestA._id.toString()
        const keyB = requestB._id.toString()

        if (!scoreMatrix[keyA]) scoreMatrix[keyA] = {}
        if (!scoreMatrix[keyB]) scoreMatrix[keyB] = {}

        scoreMatrix[keyA][keyB] = score
        scoreMatrix[keyB][keyA] = score
      }
    }

    const groups = findGroups(processingRequests, scoreMatrix, threshold)

    console.log('📊 PROCESSING:', processingRequests.length)
    console.log('📊 GROUPS FOUND:', groups.length)
    console.log('👥 GROUPS RESULT:', groups.map((g) => g.map((r) => r.userId)))

    for (const group of groups) {
      await createMatch(group, eventId, event.name)
    }

    // Request yang tidak masuk group manapun
    const matchedRequestIds = new Set(groups.flat().map((r) => r._id.toString()))
    const remainingRequests = processingRequests.filter(
      (r) => !matchedRequestIds.has(r._id.toString())
    )

    const dayBeforeEvent = event.date.getTime() - 24 * 60 * 60 * 1000

    if (Date.now() > dayBeforeEvent) {
      // H-1: expire semua yang tidak ter-match
      for (const request of remainingRequests) {
        request.status = 'expired'
        await request.save()

        const user = userMap.get(request.userId.toString())
        if (user) {
          await notificationQueue.add('send-notification', {
            type: 'expired',
            data: { userId: user._id, eventName: event.name, eventId: event._id }
          })
        }
      }
    } else {
      // Belum H-1: kembalikan ke 'pending' supaya bisa di-match lagi nanti
      for (const request of remainingRequests) {
        request.status = 'pending'
        await request.save()
      }
    }

    // Safety net: tidak ada group terbentuk (semua score < threshold) → force match 2 teratas
    if (groups.length === 0 && processingRequests.length >= 2) {
      console.log('⚠ No groups formed with threshold, forcing match with top 2 requests')
      const forceGroup = processingRequests.slice(0, 2)
      await createMatch(forceGroup, eventId, event.name)

      // Kembalikan sisa ke pending
      const forcedIds = new Set(forceGroup.map((r) => r._id.toString()))
      for (const request of processingRequests) {
        if (!forcedIds.has(request._id.toString())) {
          request.status = 'pending'
          await request.save()
        }
      }
    }
  } catch (err) {
    // Error tak terduga → rollback semua ke 'pending' supaya tidak stuck
    console.error(`❌ runMatching error for event ${eventId}:`, err)
    await MatchRequest.updateMany(
      { eventId, status: 'processing' },
      { $set: { status: 'pending' } }
    )
    throw err
  }
}

// ─── Group Finding ────────────────────────────────────────────────────────────

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

      const allScoresAboveThreshold = group.every((member) => {
        const memberId = member._id.toString()
        const memberScore = scoreMatrix[memberId]?.[otherRequestId] || 0
        return memberScore >= threshold
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

// ─── Create Match ─────────────────────────────────────────────────────────────

async function createMatch(group: any[], eventId: string, eventName: string) {
  const memberIds = group.map((r) => r.userId.toString())

  // Buat Match dulu supaya matchId sudah ada sebelum ChatRoom di-save.
  // Urutan: Match (tanpa chatRoomId) → ChatRoom (dengan matchId) → update Match (isi chatRoomId)
  const match = new Match({
    eventId,
    memberIds,
    status: 'matched'
  })
  await match.save()

  const chatRoom = new ChatRoom({
    eventId,
    matchId: match._id,
    memberIds,
    confirmationStatus: new Map(),
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
  })
  await chatRoom.save()

  match.chatRoomId = chatRoom._id
  await match.save()

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
      data: { userId: request.userId, matchId: match._id, eventName }
    })
  }

  console.log(`✅ Match created: ${match._id} | Members: ${memberIds.join(', ')}`)
}

// ─── Rematch ──────────────────────────────────────────────────────────────────

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

  const users = await User.find({ _id: { $in: pendingRequests.map((r) => r.userId) } })
  const userMap = new Map(users.map((u) => [u._id.toString(), u]))

  for (const request of pendingRequests) {
    const user = userMap.get(request.userId.toString())
    if (
      !user ||
      user.blockedUsers.some((blockedId: string) => remainingMembers.includes(blockedId))
    ) {
      continue
    }

    const allScores = remainingMembers.map((memberId) => {
      const member = userMap.get(memberId)
      return member ? member.ratingAvg || 3 : 0
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