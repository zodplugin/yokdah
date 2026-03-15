import { Event } from '../models/Event'
import { notificationQueue } from '../config/queue'

interface ExternalEvent {
  name: string
  venue: string
  city: string
  date: Date
  endTime?: Date
  category: 'concert' | 'party' | 'activity' | 'sport'
  description: string
  coverImage: string
  ticketUrl: string
  source: string
  sourceId: string
}

export async function scrapeEvents() {
  const sources = ['ticketmaster', 'eventbrite', 'resident-advisor', 'songkick']

  for (const source of sources) {
    try {
      const events = await scrapeFromSource(source)
      await processEvents(events, source)
    } catch (error) {
      console.error(`Error scraping from ${source}:`, error)
    }
  }
}

async function scrapeFromSource(source: string): Promise<ExternalEvent[]> {
  const events: ExternalEvent[] = []

  if (source === 'ticketmaster') {
    await scrapeTicketmaster(events)
  } else if (source === 'eventbrite') {
    await scrapeEventbrite(events)
  } else if (source === 'resident-advisor') {
    await scrapeResidentAdvisor(events)
  } else if (source === 'songkick') {
    await scrapeSongkick(events)
  }

  return events
}

async function scrapeTicketmaster(events: ExternalEvent[]) {
  console.log('Scraping Ticketmaster...')
}

async function scrapeEventbrite(events: ExternalEvent[]) {
  console.log('Scraping Eventbrite...')
}

async function scrapeResidentAdvisor(events: ExternalEvent[]) {
  console.log('Scraping Resident Advisor...')
}

async function scrapeSongkick(events: ExternalEvent[]) {
  console.log('Scraping Songkick...')
}

async function processEvents(events: ExternalEvent[], source: string) {
  for (const eventData of events) {
    const existingEvent = await Event.findOne({
      source,
      sourceId: eventData.sourceId
    })

    if (existingEvent) {
      await updateEvent(existingEvent, eventData)
    } else {
      await createPendingEvent(eventData, source)
    }
  }
}

async function updateEvent(event: any, data: ExternalEvent) {
  let needsUpdate = false

  if (event.name !== data.name) {
    event.name = data.name
    needsUpdate = true
  }

  if (event.venue !== data.venue) {
    event.venue = data.venue
    needsUpdate = true
  }

  if (event.description !== data.description) {
    event.description = data.description
    needsUpdate = true
  }

  if (needsUpdate) {
    await event.save()
  }
}

async function createPendingEvent(data: ExternalEvent, source: string) {
  const event = new Event({
    ...data,
    source,
    status: 'pending_review'
  })

  await event.save()

  const { notificationQueue } = await import('../config/queue')
  await notificationQueue.add('send-notification', {
    type: 'new_event',
    data: {
      eventId: event._id,
      eventName: event.name
    }
  })
}

export async function hideExpiredEvents() {
  const result = await Event.updateMany(
    {
      date: { $lt: new Date() },
      status: { $ne: 'expired' }
    },
    { status: 'expired' }
  )

  console.log(`Hidden ${result.modifiedCount} expired events`)
}