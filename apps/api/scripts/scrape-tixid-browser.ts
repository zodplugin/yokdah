import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'
import { Event } from '../src/models/Event'
import { MONGODB_URI, extractEventsFromJsonLd, inferCategory } from './scrape-utils'

// This scraper uses a real browser because https://www.tix.id is protected by Cloudflare/CAPTCHA
// and blocks plain fetch() in many environments.
//
// Requirements:
//   - Install Playwright (one-time): npm i -D playwright && npx playwright install chromium
//   - Optionally provide a storageState file (logged-in cookies) via TIXID_STORAGE_STATE.
//
// Usage:
//   npm run scrape:tixid:browser
//   TIXID_STORAGE_STATE=./scripts/.auth/tixid.json npm run scrape:tixid:browser

const BASE_URL = 'https://www.tix.id'
const LIST_URL = 'https://www.tix.id/'

type AnyObj = Record<string, any>

function pickFirstString(obj: AnyObj, keys: string[]) {
  for (const k of keys) {
    const v = obj?.[k]
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

function mapJsonLdEventToEvent(ld: AnyObj, ticketUrl: string, sourceId: string) {
  const name = pickFirstString(ld, ['name'])
  const date = parseDateMaybe(ld.startDate || ld.start_date)

  const location = ld.location || {}
  const venue = (typeof location === 'object' ? pickFirstString(location, ['name']) : '') || 'TBA'
  const address = typeof location === 'object' ? (location.address || {}) : {}
  const city =
    (typeof address === 'object' ? pickFirstString(address, ['addressLocality', 'addressRegion']) : '') ||
    pickFirstString(ld, ['city', 'region']) ||
    'Unknown'

  const image = Array.isArray(ld.image) ? ld.image[0] : ld.image
  const coverImage = typeof image === 'string' && image ? image : 'https://via.placeholder.com/800x400?text=No+Image'

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
    ticketUrl,
    source: 'tixid',
    sourceId,
    status: 'active' as const,
    location_name: venue
  }
}

async function scrapeTixIdBrowser() {
  // Import lazily so normal dev runs don't require Playwright.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { chromium } = require('playwright') as typeof import('playwright')

  const storageStatePath = process.env.TIXID_STORAGE_STATE
    ? path.resolve(process.cwd(), process.env.TIXID_STORAGE_STATE)
    : null

  console.log('Connecting to MongoDB...')
  await mongoose.connect(MONGODB_URI)
  console.log('Connected successfully.')

  console.log('Launching browser...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext(
    storageStatePath
      ? { storageState: storageStatePath }
      : undefined
  )
  const page = await context.newPage()

  console.log(`Opening ${LIST_URL}`)
  await page.goto(LIST_URL, { waitUntil: 'domcontentloaded' })

  // If Cloudflare interstitial appears, you may need to run headed once and save storage state.
  const title = await page.title()
  if (/just a moment|attention required|access denied/i.test(title)) {
    throw new Error(
      'TIX ID blocked the scraper with Cloudflare. Run with a real session (storageState) or execute once headed to pass the challenge.'
    )
  }

  // Wait a bit for SPA content.
  await page.waitForTimeout(1500)

  const links: string[] = await page.evaluate(() => {
    const out = new Set<string>()
    document.querySelectorAll('a[href]').forEach((a) => {
      const href = (a as HTMLAnchorElement).href
      if (!href) return
      try {
        const u = new URL(href)
        if (u.hostname.endsWith('tix.id') && u.pathname.startsWith('/events/')) {
          out.add(u.pathname)
        }
      } catch {
        // ignore
      }
    })
    return Array.from(out)
  })

  console.log(`Found ${links.length} event links on listing page`)
  let imported = 0
  let skipped = 0

  for (const p of links.slice(0, 80)) {
    const url = `${BASE_URL}${p}`
    const slug = p.split('/').filter(Boolean).pop() || p
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(600)
      const html = await page.content()
      const ldEvents = extractEventsFromJsonLd(html)
      let mapped: any | null = null
      for (const ld of ldEvents) {
        mapped = mapJsonLdEventToEvent(ld, url, slug)
        if (mapped) break
      }
      if (!mapped) {
        skipped++
        continue
      }

      await Event.findOneAndUpdate(
        { source: 'tixid', sourceId: mapped.sourceId },
        mapped,
        { upsert: true, new: true }
      )
      imported++
    } catch (err) {
      console.error(`Error importing TIX ID event ${url}:`, (err as any)?.message || err)
      skipped++
    }
  }

  console.log('--- TIX ID Import Summary (browser) ---')
  console.log(`Links scanned: ${Math.min(links.length, 80)}`)
  console.log(`Successfully imported/updated: ${imported}`)
  console.log(`Failed/Skipped: ${skipped}`)
  console.log('--------------------------------------')

  await browser.close()
  process.exit(0)
}

scrapeTixIdBrowser().catch((e) => {
  console.error('Scraper error (TIX ID browser):', e)
  process.exit(1)
})

