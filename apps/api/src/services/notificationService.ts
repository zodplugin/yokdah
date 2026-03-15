import { Notification } from '../models/Notification'
import { User } from '../models/User'
import { 
  sendWhatsApp, 
  getMatchFoundMessage, 
  getConfirmationMessage, 
  getRatingMessage, 
  getReminderMessage,
  getExpiredMessage,
  getRemovedGhostMessage,
  getRemovedLateMessage,
  getGroupDissolvedMessage,
  getReplacementOfferMessage,
  getReliabilityWarningMessage,
  getAccountLockedMessage
} from '../utils/whatsapp'

export async function sendNotification(type: string, data: any) {
  const { userId, matchId, eventName, eventId } = data

  const user = await User.findById(userId)
  if (!user || !user.whatsappNumber) {
    return
  }

  let notification: any = {
    userId,
    type,
    title: '',
    message: '',
    data: {},
    isRead: false
  }

  let whatsappMessage = ''
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000'

  switch (type) {
    case 'match_found':
      notification.title = 'Your squad is ready! 🎉'
      notification.message = `We've found your squad for ${eventName}! Start chatting now.`
      notification.data = { matchId, eventName }
      whatsappMessage = getMatchFoundMessage(eventName, `${baseUrl}/matches/${matchId}`)
      break

    case 'confirmation_req':
      notification.title = 'Confirm your spot'
      notification.message = `Let your squad know if you're going to ${eventName}.`
      notification.data = { matchId, eventName }
      whatsappMessage = getConfirmationMessage(user.displayName, eventName, `${baseUrl}/matches/${matchId}`)
      break

    case 'new_message':
      notification.title = 'New message'
      notification.message = data.message
      notification.data = { chatRoomId: data.chatRoomId }
      break

    case 'member_removed':
      notification.title = 'Group changed'
      notification.message = `Your group for ${eventName} has changed.`
      notification.data = { matchId, eventName }
      break

    case 'replacement_offer':
      notification.title = 'A spot opened up!'
      notification.message = `A spot just opened in a group for ${eventName}. ${data.groupSize} people are already confirmed.`
      notification.data = { matchId, eventName, groupSize: data.groupSize }
      whatsappMessage = getReplacementOfferMessage(user.displayName, eventName, data.groupSize, `${baseUrl}/matches/${matchId}`)
      break

    case 'rating_request':
      notification.title = 'Rate your squad'
      notification.message = `How was your experience at ${eventName}? Rate your squad!`
      notification.data = { matchId, eventName }
      whatsappMessage = getRatingMessage(eventName, `${baseUrl}/rate/${matchId}`)
      break

    case 'event_reminder':
      notification.title = 'Event tomorrow!'
      notification.message = `${eventName} is happening tomorrow!`
      notification.data = { eventId, eventName }
      whatsappMessage = getReminderMessage(eventName, data.eventDate)
      break

    case 'reliability_warn':
      notification.title = 'Reliability score warning'
      notification.message = 'Your reliability score is low. Keep confirming and attending events to improve it.'
      notification.data = {}
      whatsappMessage = getReliabilityWarningMessage(user.displayName, user.reliabilityScore)
      break

    case 'account_locked':
      notification.title = 'Account temporarily restricted'
      notification.message = 'Your account has been temporarily locked. Check your WhatsApp for details.'
      notification.data = {}
      whatsappMessage = getAccountLockedMessage(user.displayName)
      break

    case 'group_dissolved':
      notification.title = 'Group dissolved'
      notification.message = 'Your group has dissolved. Find a new squad!'
      notification.data = { eventId }
      whatsappMessage = getGroupDissolvedMessage(user.displayName)
      break

    case 'expired':
      notification.title = 'No squad found'
      notification.message = `We couldn't find a squad for ${eventName} this time. Try other events!`
      notification.data = { eventId, eventName }
      whatsappMessage = getExpiredMessage(eventName, data.similarEvents || [])
      break

    case 'removed_ghost':
      notification.title = 'Removed from group'
      notification.message = `You were removed from the group for ${eventName} because you didn't confirm in time.`
      notification.data = { eventId, eventName }
      whatsappMessage = getRemovedGhostMessage(user.displayName, eventName)
      break

    case 'removed_late':
      notification.title = 'Removed from group'
      notification.message = `You were removed from the group for ${eventName} due to late cancellation.`
      notification.data = { eventId, eventName }
      whatsappMessage = getRemovedLateMessage(user.displayName, eventName)
      break

    default:
      return
  }

  await Notification.create(notification)

  if (whatsappMessage) {
    await sendWhatsApp(user.whatsappNumber, whatsappMessage)
  }
}