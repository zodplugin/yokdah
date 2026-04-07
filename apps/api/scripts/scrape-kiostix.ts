import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { Event } from '../src/models/Event'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fomoin'
const API_URL = 'https://www.kiostix.com/api/kiostix/events'
const IMAGE_BASE_URL = 'https://staticassets.kiostix.com/'

function inferCategory(name: string): 'concert' | 'festival' | 'party' | 'activity' | 'sport' {
  const lowerName = name.toLowerCase()
  if (lowerName.includes('fest') || lowerName.includes('festival')) return 'festival'
  if (lowerName.includes('concert') || lowerName.includes('show') || lowerName.includes('live')) return 'concert'
  if (lowerName.includes('party')) return 'party'
  if (lowerName.includes('run') || lowerName.includes('marathon') || lowerName.includes('sport')) return 'sport'
  if (lowerName.includes('activity') || lowerName.includes('expo') || lowerName.includes('sale') || lowerName.includes('dance')) return 'activity'
  return 'activity'
}

async function scrapeKiostix() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('Connected successfully.')

    console.log(`Fetching data from ${API_URL} (POST)...`)
    let externalEvents = []
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json;charset=UTF-8',
          'Origin': 'https://www.kiostix.com',
          'Referer': 'https://www.kiostix.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36'
        },
        body: JSON.stringify({ page: 1, limit: 100 })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Failed to fetch: ${response.statusText}`, errorText)
        throw new Error(`Failed to fetch: ${response.statusText}`)
      }

      const responseText = await response.text()
      const externalEventsData = JSON.parse(responseText)
      externalEvents = externalEventsData.data || []
    } catch (fetchError) {
      console.warn('Live fetch failed. Using fallback data provided by user...')
      // Fallback data provided by the user in the prompt
      externalEvents = [
        {
            "created_at": "2026-03-14T13:38:15.498Z",
            "id": "9f0db57c-405a-45ac-9882-688c282a486f",
            "keyword": "Kompilasik",
            "media": { "fileName": "9f0db57c-405a-45ac-9882-688c282a486f_1773566199542.jpeg" },
            "translations": [{ "locale": "id", "title": "Kompilasik", "slug": "kompilasik" }],
            "venue": { "title": "Sumbawa Besar", "information": { "city": { "name": "NTB" } } },
            "schedules": [{ "started_at": "2026-06-21T15:45:00.000Z" }]
        },
        {
            "created_at": "2026-02-23T05:54:09.957Z",
            "id": "1f7942dd-355b-4fea-a90e-99d512a32250",
            "keyword": "WORLD OF DANCE AMBON",
            "media": { "fileName": "1f7942dd-355b-4fea-a90e-99d512a32250_1771826410212.png" },
            "translations": [{ "locale": "id", "title": "WORLD OF DANCE AMBON", "slug": "world-of-dance-ambon" }],
            "venue": { "title": "Taman Budaya Ambon", "information": { "city": { "name": "Ambon" } } },
            "schedules": [{ "started_at": "2026-04-18T10:57:00.000Z" }]
        },
        {
            "created_at": "2026-02-09T03:37:32.631Z",
            "id": "ba2e9bdc-d222-4ebe-9940-06ebf2ec155e",
            "keyword": "QNF CHAPTER 5.0",
            "media": { "fileName": "ba2e9bdc-d222-4ebe-9940-06ebf2ec155e_1771402689434.png" },
            "translations": [{ "locale": "id", "title": "QNF CHAPTER 5.0", "slug": "qnf-chapter-5-0" }],
            "venue": { "title": "Karawang", "information": { "city": { "name": "Karawang" } } },
            "schedules": [{ "started_at": "2026-10-10T22:07:00.000Z" }]
        },
        {
            "created_at": "2026-02-03T04:26:36.019Z",
            "id": "8017a6e4-bcb0-4215-8b2b-1b955a8518c7",
            "keyword": "KARS RUN 2026",
            "media": { "fileName": "8017a6e4-bcb0-4215-8b2b-1b955a8518c7_1772278852464.png" },
            "translations": [{ "locale": "id", "title": "KARS RUN 2026", "slug": "kars-run-2026" }],
            "venue": { "title": "Senayan Park", "information": { "city": { "name": "Jakarta Pusat" } } },
            "schedules": [{ "started_at": "2026-05-03T09:42:00.000Z" }]
        },
        {
            "created_at": "2026-01-30T11:24:45.340Z",
            "id": "28f4aa08-836a-48a5-a76d-e29c1128d1aa",
            "keyword": "LIMAU FEST 2026",
            "media": { "fileName": "28f4aa08-836a-48a5-a76d-e29c1128d1aa_1773575811479.png" },
            "translations": [{ "locale": "id", "title": "LIMAU FEST 2026", "slug": "limau-fest-2026" }],
            "venue": { "title": "Gelora Bung Karno - Aquatics Center", "information": { "city": { "name": "Jakarta Pusat" } } },
            "schedules": [{ "started_at": "2026-04-26T15:29:00.000Z" }]
        },
        {
            "created_at": "2026-01-29T05:38:55.730Z",
            "id": "ce6879ff-92e7-44ed-91d9-cc102f5f8c2d",
            "keyword": "Dalawampu",
            "media": { "fileName": "ce6879ff-92e7-44ed-91d9-cc102f5f8c2d_1774169036952.png" },
            "translations": [{ "locale": "id", "title": "Dalawampu", "slug": "dalawampu" }],
            "venue": { "title": "Bandung", "information": { "city": { "name": "Jawa Barat" } } },
            "schedules": [{ "started_at": "2026-07-11T16:41:00.000Z" }]
        },
        {
            "created_at": "2025-11-27T12:54:28.658Z",
            "id": "99c66d9c-f465-40e0-9818-4243329a4c11",
            "keyword": "ALSEACE 2026",
            "media": { "fileName": "99c66d9c-f465-40e0-9818-4243329a4c11_1772970423962.jpeg" },
            "translations": [{ "locale": "id", "title": "ALSEACE 2026", "slug": "alseace-2026" }],
            "venue": { "title": "Uptown Park Summarecon Mall Serpong", "information": { "city": { "name": "Tangerang" } } },
            "schedules": [{ "started_at": "2026-04-25T08:42:00.000Z" }]
        },
        {
            "created_at": "2025-11-06T04:18:36.018Z",
            "id": "97b713cb-2154-4c2c-9fca-48747eea4ca5",
            "keyword": "FREEDOM",
            "media": { "fileName": "97b713cb-2154-4c2c-9fca-48747eea4ca5_1768912321985.jpeg" },
            "translations": [{ "locale": "id", "title": "FREEDOM EXODUS", "slug": "freedom-exodus" }],
            "venue": { "title": "Buperta Cibubur", "information": { "city": { "name": "Jakarta Timur" } } },
            "schedules": [{ "started_at": "2026-05-15T09:22:00.000Z" }]
        }
      ]
    }

    console.log(`Processing ${externalEvents.length} events...`)

    let importedCount = 0
    let skippedCount = 0

    for (const ext of externalEvents) {
      const translation = ext.translations.find((t: any) => t.locale === 'id') || ext.translations[0]
      const schedule = ext.schedules[0] || {}
      
      const eventData = {
        name: translation.title || ext.keyword,
        venue: ext.venue?.title || 'TBA',
        city: ext.venue?.information?.city?.name || 'Unknown',
        date: new Date(schedule.started_at || ext.live_date),
        endTime: schedule.ended_at ? new Date(schedule.ended_at) : undefined,
        category: inferCategory(translation.title || ext.keyword),
        description: `Experience ${translation.title || ext.keyword} at ${ext.venue?.title || 'the venue'}. Tickets available on Kiostix.`,
        coverImage: ext.media?.fileName ? `${IMAGE_BASE_URL}${ext.media.fileName}` : 'https://via.placeholder.com/800x400?text=No+Image',
        ticketUrl: `https://www.kiostix.com/e/${translation.slug || ext.id}`,
        source: 'kiostix',
        sourceId: ext.id,
        status: 'active',
        location_name: ext.venue?.title,
      }

      try {
        await Event.findOneAndUpdate(
          { source: 'kiostix', sourceId: ext.id },
          eventData,
          { upsert: true, new: true }
        )
        importedCount++
      } catch (err) {
        console.error(`Error importing event ${ext.keyword}:`, err)
        skippedCount++
      }
    }

    console.log('--- Kiostix Import Summary ---')
    console.log(`Total events processed: ${externalEvents.length}`)
    console.log(`Successfully imported/updated: ${importedCount}`)
    console.log(`Failed/Skipped: ${skippedCount}`)
    console.log('------------------------------')

    process.exit(0)
  } catch (error) {
    console.error('Scraper error:', error)
    process.exit(1)
  }
}

scrapeKiostix()
