import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { Event } from '../src/models/Event'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fomoin'
const API_URL = 'https://www.loket.com/api/v1/section/detail/15'

function inferCategory(name: string, formatName?: string): 'concert' | 'festival' | 'party' | 'activity' | 'sport' {
  const text = `${name} ${formatName || ''}`.toLowerCase()
  if (text.includes('fest') || text.includes('festival')) return 'festival'
  if (text.includes('concert') || text.includes('konser') || text.includes('show') || text.includes('live')) return 'concert'
  if (text.includes('party')) return 'party'
  if (text.includes('run') || text.includes('marathon') || text.includes('sport')) return 'sport'
  if (text.includes('activity') || text.includes('expo') || text.includes('sale') || text.includes('dance') || text.includes('fanmeeting') || text.includes('pameran')) return 'activity'
  return 'activity'
}

async function scrapeLoket() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('Connected successfully.')

    console.log(`Fetching data from ${API_URL}...`)
    const response = await fetch(API_URL, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36'
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to fetch Loket: ${response.statusText}`, errorText)
      throw new Error(`Failed to fetch Loket: ${response.statusText}`)
    }

    const json = await response.json()
    const externalEvents = json.result?.section_events || []
    
    console.log(`Processing ${externalEvents.length} events from Loket...`)

    let importedCount = 0
    let skippedCount = 0

    for (const ext of externalEvents) {
      const event = ext.event
      const schedule = ext.schedule
      const location = ext.location
      const metadata = ext.metadata || {}
      
      const eventData = {
        name: event.name,
        venue: location.location_name || 'TBA',
        city: location.district || location.province || 'Unknown',
        date: new Date(schedule.start),
        endTime: schedule.end ? new Date(schedule.end) : undefined,
        category: inferCategory(event.name, metadata.format?.name),
        description: `Experience ${event.name} at ${location.location_name || 'the venue'}. Tickets available on Loket.com.`,
        coverImage: event.banner || 'https://via.placeholder.com/800x400?text=No+Image',
        ticketUrl: event.url || `https://www.loket.com/event/${ext.identifier}`,
        source: 'loket',
        sourceId: ext.identifier,
        status: 'active',
        location_name: location.location_name,
        // Optional: you can add price range to description or metadata if needed
      }

      try {
        await Event.findOneAndUpdate(
          { source: 'loket', sourceId: ext.identifier },
          eventData,
          { upsert: true, new: true }
        )
        importedCount++
      } catch (err) {
        console.error(`Error importing event ${event.name}:`, err)
        skippedCount++
      }
    }

    console.log('--- Loket Import Summary ---')
    console.log(`Total events processed: ${externalEvents.length}`)
    console.log(`Successfully imported/updated: ${importedCount}`)
    console.log(`Failed/Skipped: ${skippedCount}`)
    console.log('----------------------------')

    process.exit(0)
  } catch (error) {
    console.error('Scraper error (Loket):', error)
    process.exit(1)
  }
}

scrapeLoket()
