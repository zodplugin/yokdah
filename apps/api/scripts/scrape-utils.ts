import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fomoin'

export const SCRAPER_USER_AGENT =
  process.env.SCRAPER_USER_AGENT ||
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36'

export function inferCategory(
  name: string,
  extra?: string
): 'concert' | 'festival' | 'party' | 'activity' | 'sport' {
  const text = `${name} ${extra || ''}`.toLowerCase()
  if (text.includes('fest') || text.includes('festival')) return 'festival'
  if (text.includes('concert') || text.includes('konser') || text.includes('show') || text.includes('live')) return 'concert'
  if (text.includes('party') || text.includes('club')) return 'party'
  if (text.includes('run') || text.includes('marathon') || text.includes('sport') || text.includes('race')) return 'sport'
  if (
    text.includes('activity') ||
    text.includes('expo') ||
    text.includes('sale') ||
    text.includes('dance') ||
    text.includes('fanmeeting') ||
    text.includes('pameran') ||
    text.includes('workshop')
  ) {
    return 'activity'
  }
  return 'activity'
}

export async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      'User-Agent': SCRAPER_USER_AGENT,
      ...(init?.headers || {})
    }
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Fetch failed ${res.status} ${res.statusText} (${url}) ${body.slice(0, 300)}`)
  }

  return res.json()
}

export async function fetchText(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': SCRAPER_USER_AGENT,
      ...(init?.headers || {})
    }
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Fetch failed ${res.status} ${res.statusText} (${url}) ${body.slice(0, 300)}`)
  }

  return res.text()
}

export function extractNextData(html: string): any | null {
  // Next.js app data usually lives in: <script id="__NEXT_DATA__" type="application/json">...</script>
  // Some deployments omit quotes around the id or minify attributes, so we use a permissive regex.
  const re = /<script\b[^>]*\bid\s*=\s*(?:"__NEXT_DATA__"|'__NEXT_DATA__'|__NEXT_DATA__)\b[^>]*>([\s\S]*?)<\/script>/i
  const match = html.match(re)
  if (!match) return null

  const jsonText = (match[1] || '').trim()
  if (!jsonText) return null

  try {
    return JSON.parse(jsonText)
  } catch {
    return null
  }
}

export function extractJsonLd(html: string): any[] {
  const results: any[] = []
  const re = /<script\b[^>]*type\s*=\s*(?:"application\/ld\+json"|'application\/ld\+json'|application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(html))) {
    const raw = (match[1] || '').trim()
    if (!raw) continue
    try {
      results.push(JSON.parse(raw))
    } catch {
      // ignore
    }
  }
  return results
}

function normalizeToArray(value: any): any[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  return [value]
}

export function extractEventsFromJsonLd(html: string): any[] {
  const blocks = extractJsonLd(html)
  const events: any[] = []

  const visit = (node: any) => {
    if (!node) return
    if (Array.isArray(node)) {
      node.forEach(visit)
      return
    }
    if (typeof node !== 'object') return

    const type = node['@type']
    if (type) {
      const types = normalizeToArray(type).map((t) => String(t).toLowerCase())
      if (types.includes('event')) events.push(node)
    }

    if (node['@graph']) visit(node['@graph'])
  }

  blocks.forEach(visit)
  return events
}

export function walk(obj: any, visitor: (value: any, path: string) => void, pathStr = '$', depth = 0) {
  if (depth > 12) return
  visitor(obj, pathStr)
  if (!obj || typeof obj !== 'object') return

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      walk(obj[i], visitor, `${pathStr}[${i}]`, depth + 1)
    }
    return
  }

  for (const [k, v] of Object.entries(obj)) {
    walk(v, visitor, `${pathStr}.${k}`, depth + 1)
  }
}

export function findLikelyEventArrays(root: any): any[][] {
  const arrays: any[][] = []
  walk(root, (value) => {
    if (!Array.isArray(value) || value.length === 0) return
    const sample = value[0]
    if (!sample || typeof sample !== 'object') return
    const keys = Object.keys(sample).map(k => k.toLowerCase())
    const hasTitle = keys.includes('title') || keys.includes('name') || keys.includes('eventname')
    const hasDate =
      keys.some(k => k.includes('date')) ||
      keys.some(k => k.includes('start')) ||
      keys.some(k => k.includes('schedule'))
    const hasId = keys.includes('id') || keys.includes('_id') || keys.includes('slug') || keys.includes('uuid')
    if (hasTitle && hasDate && hasId) arrays.push(value as any[])
  })
  return arrays
}
