import { ChatRoom } from '../models/ChatRoom'
import { ChatMessage } from '../models/ChatMessage'
import { Match } from '../models/Match'
import { User } from '../models/User'
import { Event } from '../models/Event'
import { updateReliabilityScore } from './reliabilityService'
import { rematchGroup } from './matchingService'
import { notificationQueue } from '../config/queue'
import { calculateDaysUntilEvent } from '../utils/helpers'

export async function sendConfirmationPrompts() {
  const activeMatches = await Match.find({
    status: { $in: ['matched', 'confirmed'] }
  })

  for (const match of activeMatches) {
    const event = await Event.findById(match.eventId)
    if (!event) continue

    const daysUntilEvent = calculateDaysUntilEvent(event.date)

    const chatRoom = await ChatRoom.findOne({ matchId: match._id })
    if (!chatRoom) continue

    if (daysUntilEvent === 5) {
      await sendSoftConfirmationPrompt(chatRoom, event)
    } else if (daysUntilEvent === 2) {
      await sendHardConfirmationPrompt(chatRoom, event)
    } else if (daysUntilEvent === 1) {
      await sendFinalReminder(chatRoom, event)
    }
  }
}

async function sendSoftConfirmationPrompt(chatRoom: any, event: any) {
  const message = new ChatMessage({
    chatRoomId: chatRoom._id,
    senderId: 'system',
    type: 'system',
    systemMessageType: 'confirmation-prompt',
    content: `Event is in 5 days! Let your squad know if you're coming.`,
    readBy: []
  })

  await message.save()

  for (const userId of chatRoom.memberIds) {
    await notificationQueue.add('send-notification', {
      type: 'confirmation_req',
      data: {
        userId,
        matchId: chatRoom.matchId,
        eventName: event.name
      }
    })
  }
}

async function sendHardConfirmationPrompt(chatRoom: any, event: any) {
  const message = new ChatMessage({
    chatRoomId: chatRoom._id,
    senderId: 'system',
    type: 'system',
    systemMessageType: 'confirmation-prompt',
    content: `Are you going to ${event.name}? Your squad needs to know. Respond by tomorrow or you'll be removed.`,
    readBy: []
  })

  await message.save()

  const users = await User.find({ _id: { $in: chatRoom.memberIds } })

  for (const user of users) {
    await notificationQueue.add('send-notification', {
      type: 'confirmation_req',
      data: {
        userId: user._id,
        matchId: chatRoom.matchId,
        eventName: event.name
      }
    })
  }
}

async function sendFinalReminder(chatRoom: any, event: any) {
  const users = await User.find({ _id: { $in: chatRoom.memberIds } })

  for (const user of users) {
    await notificationQueue.add('send-notification', {
      type: 'confirmation_req',
      data: {
        userId: user._id,
        matchId: chatRoom.matchId,
        eventName: event.name
      }
    })
  }
}

export async function checkConfirmationDeadlines() {
  const activeMatches = await Match.find({
    status: { $in: ['matched', 'confirmed'] }
  })

  for (const match of activeMatches) {
    const event = await Event.findById(match.eventId)
    if (!event) continue

    const daysUntilEvent = calculateDaysUntilEvent(event.date)

    if (daysUntilEvent <= 0) {
      const chatRoom = await ChatRoom.findOne({ matchId: match._id })
      if (!chatRoom) continue

      await processConfirmation(chatRoom, match, event)
    }
  }
}

async function processConfirmation(chatRoom: any, match: any, event: any) {
  const usersToRemove: string[] = []

  for (const [userId, status] of chatRoom.confirmationStatus.entries()) {
    if (status !== 'going') {
      usersToRemove.push(userId)

      const user = await User.findById(userId)
      if (user) {
        if (status === 'pending') {
          await updateReliabilityScore(
            user._id,
            'ghost',
            -20,
            `Didn't confirm attendance for ${event.name}`,
            event._id,
            match._id
          )
        } else if (status === 'not-going') {
          await updateReliabilityScore(
            user._id,
            'no-show',
            -30,
            `Confirmed not going for ${event.name}`,
            event._id,
            match._id
          )
        }

        const leaveMessage = new ChatMessage({
          chatRoomId: chatRoom._id,
          senderId: 'system',
          type: 'system',
          systemMessageType: 'member-removed',
          content: `${user.displayName} didn't confirm and has been removed.`,
          readBy: []
        })
        await leaveMessage.save()
      }
    } else {
      await updateReliabilityScore(
        userId,
        'attend',
        0,
        `Attended ${event.name}`,
        event._id,
        match._id
      )

      const user = await User.findById(userId)
      if (user) {
        user.eventsAttended = (user.eventsAttended || 0) + 1
        await user.save()
      }
    }
  }

  if (usersToRemove.length > 0) {
    chatRoom.memberIds = chatRoom.memberIds.filter((id: string) => !usersToRemove.includes(id))

    for (const userId of usersToRemove) {
      chatRoom.confirmationStatus.delete(userId)
    }

    await chatRoom.save()

    if (chatRoom.memberIds.length < 2) {
      match.status = 'cancelled'
      await match.save()
    } else {
      await rematchGroup(chatRoom._id)
    }
  }
}

export async function handleUserLeaveChat(userId: string, chatRoomId: string) {
  const chatRoom = await ChatRoom.findById(chatRoomId)
  if (!chatRoom) return

  const match = await Match.findOne({ chatRoomId })
  if (!match) return

  const event = await Event.findById(match.eventId)
  if (!event) return

  const daysUntilEvent = calculateDaysUntilEvent(event.date)

  chatRoom.memberIds = chatRoom.memberIds.filter((id: string) => id !== userId)
  chatRoom.confirmationStatus.delete(userId)
  await chatRoom.save()

  if (daysUntilEvent >= 2) {
    await updateReliabilityScore(
      userId,
      'early-cancel',
      0,
      `Left group for ${event.name}`,
      event._id,
      match._id
    )
  } else {
    await updateReliabilityScore(
      userId,
      'late-cancel',
      -15,
      `Late cancel for ${event.name}`,
      event._id,
      match._id
    )
  }

  const user = await User.findById(userId)
  if (user) {
    const leaveMessage = new ChatMessage({
      chatRoomId: chatRoom._id,
      senderId: 'system',
      type: 'system',
      systemMessageType: 'member-leave',
      content: `${user.displayName} can't make it.`,
      readBy: []
    })
    await leaveMessage.save()
  }

  await rematchGroup(chatRoomId)
}