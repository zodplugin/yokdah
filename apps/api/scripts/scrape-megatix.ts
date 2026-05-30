import mongoose from 'mongoose'
import { Event } from '../src/models/Event'
import { MONGODB_URI, extractNextData, fetchText, findLikelyEventArrays, inferCategory } from './scrape-utils'

const BASE_URL = 'https://megatix.co.id'
const LIST_URL = 'https://megatix.co.id/events'

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

function pickFirstNumber(obj: AnyObj, keys: string[]) {
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'number' && Number.isFinite(v)) return v
    if (typeof v === 'string' && v.trim() && !Number.isNaN(Number(v))) return Number(v)
  }
  return 0
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

function stripTags(input: string) {
  return input.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function decodeEntities(input: string) {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function parseMegatixDate(text: string): Date | null {
  // Example: "08:00pm, Fri 12th Dec 2025"
  const m = text.match(/(\d{1,2}):(\d{2})(am|pm),\s*\w{3}\s*(\d{1,2})(?:st|nd|rd|th)?\s*(\w{3})\s*(\d{4})/i)
  if (!m) return null
  const hh = Number(m[1])
  const mm = Number(m[2])
  const ampm = m[3].toLowerCase()
  const day = Number(m[4])
  const monStr = m[5].toLowerCase()
  const year = Number(m[6])
  const months: Record<string, number> = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11
  }
  const mon = months[monStr]
  if (mon == null) return null
  let hour24 = hh % 12
  if (ampm === 'pm') hour24 += 12
  const d = new Date(Date.UTC(year, mon, day, hour24, mm))
  if (Number.isNaN(d.getTime())) return null
  return d
}

function extractEventSlugs(html: string): string[] {
  const slugs = new Set<string>()
  const re = /href\s*=\s*["'](?:https?:\/\/megatix\.co\.id)?\/events\/([^"'?#\s/]+)[^"']*["']/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(html))) {
    const slug = match[1]
    if (slug) slugs.add(slug)
  }
  return Array.from(slugs)
}

async function scrapeEventDetail(slug: string) {
  const url = `${BASE_URL}/events/${slug}`
  const html = await fetchText(url, { headers: { Referer: LIST_URL } })

  // title
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  const name = h1 ? decodeEntities(stripTags(h1[1])) : ''

  // og:image
  const ogImg = html.match(/property\s*=\s*["']og:image["'][^>]*content\s*=\s*["']([^"']+)["']/i)
  const coverImage = ogImg?.[1] || 'https://via.placeholder.com/800x400?text=No+Image'

  // Pull some surrounding plain text to find date & location.
  const plain = decodeEntities(stripTags(html))
  const date = parseMegatixDate(plain)
  if (!name || !date) return null

  // Heuristic venue/city: find a segment after the date string.
  const venue = 'TBA'
  const city = 'Unknown'

  return {
    name,
    venue,
    city,
    date,
    category: inferCategory(name),
    description: `Experience ${name}. Tickets available on Megatix.`,
    coverImage,
    ticketUrl: url,
    source: 'megatix',
    sourceId: slug,
    status: 'active' as const,
    location_name: venue
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
  const lookingCount = pickFirstNumber(candidate, ['lookingCount', 'looking_count', 'interestedCount', 'interested_count'])

  if (!name || !id || !date) return null

  return {
    name,
    venue,
    city,
    date,
    endTime: parseDateMaybe(candidate.endDate || candidate.end_date || candidate.end),
    category: inferCategory(name, categoryText),
    description: `Experience ${name} at ${venue}. Tickets available on Megatix.`,
    coverImage,
    ticketUrl: toTicketUrl(slug),
    source: 'megatix',
    sourceId: id,
    status: 'active' as const,
    location_name: venue,
    province: candidate.province || undefined,
    maxAttendees: candidate.maxAttendees || undefined,
    lookingCount
  }
}

async function scrapeMegatix() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('Connected successfully.')

    console.log(`Fetching Megatix page: ${LIST_URL}`)
    const html = await fetchText(LIST_URL, {
      headers: {
        Referer: BASE_URL
      }
    })

    const nextData = extractNextData(html)
    if (!nextData) {
      // Fallback: scrape links from HTML + fetch event detail pages.
      const slugs = extractEventSlugs(html)
      if (slugs.length === 0) {
        const looksBlocked =
          /forbidden|access denied|just a moment|cf-ray|captcha|cloudflare/i.test(html) ||
          /__cf_chl|cf-chl/i.test(html)
        if (looksBlocked) {
          throw new Error('Megatix: access blocked (likely Cloudflare/CAPTCHA). Scraping needs browser-based approach or allowlisted egress.')
        }
        throw new Error('Megatix: could not find __NEXT_DATA__ and no /events/* links were found. HTML structure likely changed.')
      }

      console.log(`Megatix fallback: found ${slugs.length} event links. Fetching details...`)
      let importedCount = 0
      let skippedCount = 0

      // Keep it gentle.
      for (const slug of slugs.slice(0, 60)) {
        try {
          const ev = await scrapeEventDetail(slug)
          if (!ev) {
            skippedCount++
            continue
          }
          await Event.findOneAndUpdate(
            { source: 'megatix', sourceId: ev.sourceId },
            ev,
            { upsert: true, new: true }
          )
          importedCount++
        } catch (err) {
          console.error(`Error importing Megatix event ${slug}:`, (err as any)?.message || err)
          skippedCount++
        }
        await sleep(200)
      }

      console.log('--- Megatix Import Summary (fallback HTML) ---')
      console.log(`Total event links found: ${slugs.length}`)
      console.log(`Successfully imported/updated: ${importedCount}`)
      console.log(`Failed/Skipped: ${skippedCount}`)
      console.log('--------------------------------------------')

      process.exit(0)
    }

    const arrays = findLikelyEventArrays(nextData)
    if (arrays.length === 0) {
      throw new Error('Megatix: could not locate any likely event arrays in __NEXT_DATA__. Mapping needs updates.')
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
          { source: 'megatix', sourceId: ev.sourceId },
          ev,
          { upsert: true, new: true }
        )
        importedCount++
      } catch (err) {
        console.error(`Error importing Megatix event ${ev.name}:`, err)
        skippedCount++
      }
    }

    console.log('--- Megatix Import Summary ---')
    console.log(`Total events mapped: ${mapped.length}`)
    console.log(`Successfully imported/updated: ${importedCount}`)
    console.log(`Failed/Skipped: ${skippedCount}`)
    console.log('------------------------------')

    process.exit(0)
  } catch (error) {
    console.error('Scraper error (Megatix):', error)
    process.exit(1)
  }
}

scrapeMegatix()
