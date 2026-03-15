import { eventQueue } from '../config/queue'
import { scrapeEvents, hideExpiredEvents } from '../services/eventService'
import { sendConfirmationPrompts, checkConfirmationDeadlines } from '../services/confirmationService'
import { sendRatingRequests } from '../services/ratingService'
import { checkMonthlyNoIncidentBonus } from '../services/reliabilityService'
import { Worker } from 'bullmq'
import { getRedisConnection } from '../config/queue'

export function setupScheduledJobs() {
  if (!eventQueue) {
    console.log('Redis not available, scheduled jobs not configured')
    return
  }

  eventQueue.add('scrape-events', { type: 'scrape' }, {
    repeat: { every: 6 * 60 * 60 * 1000 }
  })

  eventQueue.add('hide-expired', { type: 'hide-expired' }, {
    repeat: { every: 24 * 60 * 60 * 1000 }
  })

  eventQueue.add('confirmation-prompts', { type: 'confirmation-prompts' }, {
    repeat: { every: 6 * 60 * 60 * 1000 }
  })

  eventQueue.add('check-deadlines', { type: 'check-deadlines' }, {
    repeat: { every: 60 * 60 * 1000 }
  })

  eventQueue.add('rating-requests', { type: 'rating-requests' }, {
    repeat: { every: 24 * 60 * 60 * 1000 }
  })

  eventQueue.add('monthly-bonus', { type: 'monthly-bonus' }, {
    repeat: { every: 30 * 24 * 60 * 60 * 1000 }
  })

  const connection = getRedisConnection()

  new Worker('event-queue', async (job: any) => {
    const { type } = job.data

    switch (type) {
      case 'scrape':
        await scrapeEvents()
        break
      case 'hide-expired':
        await hideExpiredEvents()
        break
      case 'confirmation-prompts':
        await sendConfirmationPrompts()
        break
      case 'check-deadlines':
        await checkConfirmationDeadlines()
        break
      case 'rating-requests':
        await sendRatingRequests()
        break
      case 'monthly-bonus':
        await checkMonthlyNoIncidentBonus()
        break
    }
  }, { connection })

  console.log('Scheduled jobs configured')
}