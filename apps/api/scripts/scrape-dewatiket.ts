import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { Event } from '../src/models/Event'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fomoin'
const API_URL = 'https://admin.dewatiket.id/api/v1/pages/event'

function inferCategory(name: string): 'concert' | 'festival' | 'party' | 'activity' | 'sport' {
  const lowerName = name.toLowerCase()
  if (lowerName.includes('fest') || lowerName.includes('festival')) return 'festival'
  if (lowerName.includes('concert') || lowerName.includes('show') || lowerName.includes('live')) return 'concert'
  if (lowerName.includes('party')) return 'party'
  if (lowerName.includes('run') || lowerName.includes('marathon') || lowerName.includes('sport')) return 'sport'
  if (lowerName.includes('activity') || lowerName.includes('expo') || lowerName.includes('sale')) return 'activity'
  return 'activity'
}

async function scrapeDewatiket() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('Connected successfully.')

    console.log(`Fetching data from ${API_URL}...`)
    const response = await fetch(API_URL)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`)
    }

    const { data: externalEvents } = await response.json()
    console.log(`Found ${externalEvents.length} events. Mapping data...`)

    let importedCount = 0
    let skippedCount = 0

    for (const ext of externalEvents) {
      // Basic mapping
      const eventData = {
        name: ext.name,
        venue: ext.place || 'TBA',
        city: ext.city || 'Unknown',
        date: new Date(ext.start),
        endTime: ext.end ? new Date(ext.end) : undefined,
        category: inferCategory(ext.name),
        description: `${ext.name} organized by ${ext.penyelenggara || 'Unknown'}. Visit ${ext.gmap || 'Google Maps'} for location.`,
        coverImage: ext.thumbnail_unggulan || ext.thumbnail || 'https://via.placeholder.com/800x400?text=No+Image',
        ticketUrl: `https://dewatiket.id/event/${ext.slug}`,
        source: 'dewatiket',
        sourceId: ext.id,
        status: ext.status === 'ACTIVE' ? 'active' : 'pending_review',
        location_name: ext.place,
      }

      try {
        // Upsert based on source and sourceId
        await Event.findOneAndUpdate(
          { source: 'dewatiket', sourceId: ext.id },
          eventData,
          { upsert: true, new: true }
        )
        importedCount++
      } catch (err) {
        console.error(`Error importing event ${ext.name}:`, err)
        skippedCount++
      }
    }

    console.log('--- Import Summary ---')
    console.log(`Total events processed: ${externalEvents.length}`)
    console.log(`Successfully imported/updated: ${importedCount}`)
    console.log(`Failed/Skipped: ${skippedCount}`)
    console.log('-----------------------')

    process.exit(0)
  } catch (error) {
    console.error('Scraper error:', error)
    process.exit(1)
  }
}

scrapeDewatiket()
