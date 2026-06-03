import mongoose from 'mongoose'
import { Event } from '../src/models/Event'
import { MONGODB_URI, extractEventsFromJsonLd, extractNextData, fetchText, findLikelyEventArrays, inferCategory } from './scrape-utils'

const BASE_URL = 'https://www.tix.id'
const LIST_URL = 'https://www.tix.id/events'

type AnyObj = Record<string, any>

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

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

function extractEventSlugs(html: string): string[] {
  const slugs = new Set<string>()
  const re = /href\s*=\s*["'](?:https?:\/\/(?:www\.)?tix\.id)?\/events\/([^"'?#\s/]+)[^"']*["']/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(html))) {
    const slug = match[1]
    if (slug) slugs.add(slug)
  }
  return Array.from(slugs)
}

function mapJsonLdEventToEvent(ld: AnyObj) {
  const name = pickFirstString(ld, ['name'])
  const start = ld.startDate || ld.start_date
  const date = parseDateMaybe(start)
  const location = ld.location || {}
  const venue =
    (typeof location === 'object' ? pickFirstString(location, ['name']) : '') ||
    (typeof ld.locationName === 'string' ? ld.locationName : '') ||
    'TBA'
  const address = typeof location === 'object' ? (location.address || {}) : {}
  const city =
    (typeof address === 'object' ? pickFirstString(address, ['addressLocality', 'addressRegion']) : '') ||
    pickFirstString(ld, ['city', 'region']) ||
    'Unknown'

  const image = Array.isArray(ld.image) ? ld.image[0] : ld.image
  const coverImage = typeof image === 'string' && image ? image : 'https://via.placeholder.com/800x400?text=No+Image'
  const url = pickFirstString(ld, ['url']) || BASE_URL
  const sourceId = url ? url : (name ? name : '')

  if (!name || !date) return null

  return {
    name,
    venue,
    city,
    date,
    endTime: parseDateMaybe(ld.endDate || ld.end_date),
    category: inferCategory(name),
    description: `Experience ${name} at ${venue}. Tickets available on TIX ID.`,
    coverImage,
    ticketUrl: url,
    source: 'tixid',
    sourceId,
    status: 'active' as const,
    location_name: venue,
  }
}

async function scrapeDetail(slug: string) {
  const url = `${BASE_URL}/events/${slug}`
  const html = await fetchText(url, { headers: { Referer: LIST_URL } })
  const ldEvents = extractEventsFromJsonLd(html)
  for (const ev of ldEvents) {
    const mapped = mapJsonLdEventToEvent(ev)
    if (mapped) {
      mapped.ticketUrl = url
      mapped.sourceId = slug
      return mapped
    }
  }

  // fallback minimal: use <title> as name
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const name = titleMatch ? String(titleMatch[1]).replace(/\s+/g, ' ').trim() : ''
  if (!name) return null
  return {
    name,
    venue: 'TBA',
    city: 'Unknown',
    date: new Date(),
    category: inferCategory(name),
    description: `Experience ${name}. Tickets available on TIX ID.`,
    coverImage: 'https://via.placeholder.com/800x400?text=No+Image',
    ticketUrl: url,
    source: 'tixid',
    sourceId: slug,
    status: 'pending_review' as const,
    location_name: 'TBA',
  }
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
      // Fallback A: JSON-LD event list on page
      const ldEvents = extractEventsFromJsonLd(html)
      const mappedLd = ldEvents.map(mapJsonLdEventToEvent).filter(Boolean) as any[]

      if (mappedLd.length > 0) {
        console.log(`TIX ID fallback JSON-LD: mapped ${mappedLd.length} events`)
        let imported = 0
        let skipped = 0
        for (const ev of mappedLd) {
          try {
            await Event.findOneAndUpdate(
              { source: 'tixid', sourceId: ev.sourceId },
              ev,
              { upsert: true, new: true }
            )
            imported++
          } catch (err) {
            console.error(`Error importing TIX ID event ${ev.name}:`, err)
            skipped++
          }
        }
        console.log('--- TIX ID Import Summary (JSON-LD) ---')
        console.log(`Total events mapped: ${mappedLd.length}`)
        console.log(`Successfully imported/updated: ${imported}`)
        console.log(`Failed/Skipped: ${skipped}`)
        console.log('--------------------------------------')
        process.exit(0)
      }

      // Fallback B: crawl event links from listing page
      const slugs = extractEventSlugs(html)
      if (slugs.length === 0) {
        const looksBlocked =
          /forbidden|access denied|just a moment|captcha|cloudflare/i.test(html) ||
          /__cf_chl|cf-chl/i.test(html)
      if (looksBlocked) {
        throw new Error('TIX ID: access blocked (likely Cloudflare/CAPTCHA). Scraping needs browser-based approach.')
      }
      throw new Error('TIX ID: could not find __NEXT_DATA__, no JSON-LD events, and no /events/* links found.')
    }

      console.log(`TIX ID fallback: found ${slugs.length} event links. Fetching details...`)
      let importedCount = 0
      let skippedCount = 0
      for (const slug of slugs.slice(0, 60)) {
        try {
          const ev = await scrapeDetail(slug)
          if (!ev) {
            skippedCount++
            continue
          }
          await Event.findOneAndUpdate(
            { source: 'tixid', sourceId: ev.sourceId },
            ev,
            { upsert: true, new: true }
          )
          importedCount++
        } catch (err) {
          console.error(`Error importing TIX ID event ${slug}:`, (err as any)?.message || err)
          skippedCount++
        }
        await sleep(200)
      }

      console.log('--- TIX ID Import Summary (fallback crawl) ---')
      console.log(`Total event links found: ${slugs.length}`)
      console.log(`Successfully imported/updated: ${importedCount}`)
      console.log(`Failed/Skipped: ${skippedCount}`)
      console.log('---------------------------------------------')

      process.exit(0)
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
