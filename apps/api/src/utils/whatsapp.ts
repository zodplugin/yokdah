import twilio from 'twilio'

const provider = process.env.WHATSAPP_PROVIDER || 'twilio'

let client: any = null
let fromWhatsAppNumber: string | undefined

if (provider === 'twilio') {
  client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  )
  fromWhatsAppNumber = process.env.TWILIO_WHATSAPP_FROM_NUMBER
}

export async function sendWhatsApp(to: string, message: string) {
  if (provider === 'twilio') {
    if (!fromWhatsAppNumber) {
      console.error('TWILIO_WHATSAPP_FROM_NUMBER not configured')
      return
    }

    try {
      await client.messages.create({
        from: `whatsapp:${fromWhatsAppNumber}`,
        to: `whatsapp:${to}`,
        body: message
      })
    } catch (error) {
      console.error('WhatsApp send error:', error)
      throw error
    }
  } else if (provider === 'custom') {
    const customEndpoint = process.env.CUSTOM_WHATSAPP_ENDPOINT
    if (!customEndpoint) {
      console.error('CUSTOM_WHATSAPP_ENDPOINT not configured')
      return
    }

    try {
      const response = await fetch(customEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ to, message })
      })

      if (!response.ok) {
        throw new Error(`Custom WhatsApp endpoint returned ${response.status}`)
      }
    } catch (error) {
      console.error('Custom WhatsApp send error:', error)
      throw error
    }
  } else {
    console.log(`WhatsApp provider "${provider}" not implemented, skipping`)
  }
}

export function formatWhatsAppNumber(phone: string): string {
  let formatted = phone.replace(/\D/g, '')

  if (formatted.startsWith('0') && formatted.length === 10) {
    formatted = '62' + formatted.substring(1)
  } else if (formatted.startsWith('62') && formatted.length === 12) {
    formatted = formatted
  } else if (formatted.startsWith('628') && formatted.length === 13) {
    formatted = formatted
  } else {
    throw new Error('Invalid Indonesian phone number format. Please use format: 08xxxxxxxxxx (10-12 digits) or 62xxxxxxxxxx')
  }

  return formatted
}

export function getMagicLinkMessage(displayName: string, loginUrl: string): string {
  return `Hi ${displayName}! 👋

Here's your magic link to login to Budd:

${loginUrl}

This link expires in 15 minutes.

If you didn't request this, you can safely ignore this message.`
}

export function getMatchFoundMessage(eventName: string, chatUrl: string): string {
  return `🎉 Your squad is ready!

We've found your squad for "${eventName}"! 

Start chatting with your new buddies here:
${chatUrl}

See you there! 🎉`
}

export function getConfirmationMessage(displayName: string, eventName: string, confirmUrl: string): string {
  return `Hi ${displayName}! 👋

Are you going to "${eventName}"?

Your squad needs to know. Please confirm by clicking below:
${confirmUrl}

If you can't make it, please let your squad know in the app.`
}

export function getRatingMessage(eventName: string, rateUrl: string): string {
  return `Hi! 🎉

How was your experience at "${eventName}"?

Rate your squad to help improve future matches:
${rateUrl}

You have 7 days to submit your rating.`
}

export function getReminderMessage(eventName: string, eventDate: string): string {
  return `🎉 Event Tomorrow!

"${eventName}" is happening tomorrow!

Make sure you've confirmed your spot and check with your squad.

Date: ${eventDate}`
}

export function getExpiredMessage(eventName: string, similarEvents: any[]): string {
  let message = `Hi! 👋

We couldn't find a squad for "${eventName}" this time. 

Here are some similar upcoming events you might like:\n\n`

  similarEvents.slice(0, 3).forEach((event, index) => {
    message += `${index + 1}. ${event.name} - ${event.date}\n`
  })

  message += `\nTry your luck with these events! 🍀`
  return message
}

export function getRemovedGhostMessage(displayName: string, eventName: string): string {
  return `Hi ${displayName}! 👋

We noticed you didn't respond to the confirmation deadline for "${eventName}".

As a result, you've been removed from the group. This affects your reliability score.

Try to confirm on time for future events to keep your score high!`
}

export function getRemovedLateMessage(displayName: string, eventName: string): string {
  return `Hi ${displayName}! 👋

We noticed you had to drop out last minute from "${eventName}".

Your squad has been informed. Late cancellations affect your reliability score.

Try to give more notice for future events!`
}

export function getGroupDissolvedMessage(displayName: string): string {
  return `Hi ${displayName}! 👋

Your group has dissolved. 😕

Would you like to find a new squad for another event?`
}

export function getReplacementOfferMessage(displayName: string, eventName: string, groupSize: number, joinUrl: string): string {
  return `Hi ${displayName}! 👋

A spot just opened in a group for "${eventName}"!

${groupSize} people are already confirmed going. Want to join them?

Click here to join:
${joinUrl}

This offer expires in 2 hours!`
}

export function getReliabilityWarningMessage(displayName: string, currentScore: number): string {
  return `Hi ${displayName}! 👋

Your reliability score is currently ${currentScore}/100.

Low reliability scores may limit your ability to join future events and get matched with quality buddies.

To improve your score:
- Confirm your attendance on time
- Show up for events you've confirmed
- Rate your event buddies

Keep building your reputation!`
}

export function getAccountLockedMessage(displayName: string): string {
  return `Hi ${displayName}! 👋

Your account has been temporarily restricted due to low reliability score.

🔒 This lock will be lifted in 7 days, and your score will reset to 30.

During this time, you cannot join new events.

Use this time to plan better for future events. We'll see you soon! 👋`
}
