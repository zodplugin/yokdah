import mongoose from 'mongoose'
import { Event } from '../src/models/Event'
import { MONGODB_URI, extractNextData, fetchText, findLikelyEventArrays, inferCategory } from './scrape-utils'

const BASE_URL = 'https://www.tix.id'
const LIST_URL = 'https://www.tix.id/events'

type AnyObj = Record<string, any>

function pickFirstString(obj: AnyObj, keys: string[]) {
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

function parseDateMaybe(value: any): Date | null {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d
}

function toTicketUrl(slugOrUrl: string) {
  if (!slugOrUrl) return BASE_URL
  if (slugOrUrl.startsWith('http://') || slugOrUrl.startsWith('https://')) return slugOrUrl
  if (slugOrUrl.startsWith('/')) return `${BASE_URL}${slugOrUrl}`
  return `${BASE_URL}/events/${slugOrUrl}`
}

function mapAnyToEvent(candidate: AnyObj) {
  const name = pickFirstString(candidate, ['title', 'name', 'eventName'])
  const slug = pickFirstString(candidate, ['slug', 'url', 'link'])
  const id = pickFirstString(candidate, ['id', '_id', 'uuid', 'eventId', 'slug'])

  const date =
    parseDateMaybe(candidate.startDate) ||
    parseDateMaybe(candidate.start_date) ||
    parseDateMaybe(candidate.date) ||
    parseDateMaybe(candidate.start) ||
    parseDateMaybe(candidate.eventDate) ||
    null

  const venue =
    pickFirstString(candidate, ['venue', 'venueName', 'location', 'place']) ||
    pickFirstString(candidate, ['venue_name', 'location_name']) ||
    'TBA'

  const city =
    pickFirstString(candidate, ['city', 'cityName', 'district', 'province']) ||
    pickFirstString(candidate, ['region']) ||
    'Unknown'

  const coverImage =
    pickFirstString(candidate, ['coverImage', 'cover_image', 'image', 'banner', 'thumbnail']) ||
    'https://via.placeholder.com/800x400?text=No+Image'

  const categoryText = pickFirstString(candidate, ['category', 'type', 'format'])

  if (!name || !id || !date) return null

  return {
    name,
    venue,
    city,
    date,
    endTime: parseDateMaybe(candidate.endDate || candidate.end_date || candidate.end),
    category: inferCategory(name, categoryText),
    description: `Experience ${name} at ${venue}. Tickets available on TIX ID.`,
    coverImage,
    ticketUrl: toTicketUrl(slug),
    source: 'tixid',
    sourceId: id,
    status: 'active' as const,
    location_name: venue,
    province: candidate.province || undefined,
  }
}

async function scrapeTixId() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('Connected successfully.')

    console.log(`Fetching TIX ID page: ${LIST_URL}`)
    const html = await fetchText(LIST_URL, { headers: { Referer: BASE_URL } })

    const nextData = extractNextData(html)
    if (!nextData) {
      throw new Error('TIX ID: could not find __NEXT_DATA__. Site may block bots or use a different renderer.')
    }

    const arrays = findLikelyEventArrays(nextData)
    if (arrays.length === 0) {
      throw new Error('TIX ID: could not locate any likely event arrays in __NEXT_DATA__. Mapping needs updates.')
    }

    const candidates = arrays
      .flat()
      .map((c) => (c && typeof c === 'object' ? (c as AnyObj) : null))
      .filter(Boolean) as AnyObj[]

    const mapped = candidates.map(mapAnyToEvent).filter(Boolean) as any[]
    console.log(`Found candidates: ${candidates.length}, mapped: ${mapped.length}`)

    let importedCount = 0
    let skippedCount = 0

    for (const ev of mapped) {
      try {
        await Event.findOneAndUpdate(
          { source: 'tixid', sourceId: ev.sourceId },
          ev,
          { upsert: true, new: true }
        )
        importedCount++
      } catch (err) {
        console.error(`Error importing TIX ID event ${ev.name}:`, err)
        skippedCount++
      }
    }

    console.log('--- TIX ID Import Summary ---')
    console.log(`Total events mapped: ${mapped.length}`)
    console.log(`Successfully imported/updated: ${importedCount}`)
    console.log(`Failed/Skipped: ${skippedCount}`)
    console.log('-----------------------------')

    process.exit(0)
  } catch (error) {
    console.error('Scraper error (TIX ID):', error)
    process.exit(1)
  }
}

scrapeTixId()

