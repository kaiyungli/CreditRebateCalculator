/**
 * Offer Crawler - Raw Collection Only v3
 * 
 * Uses direct REST API with workaround for sequence permission
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qcvileuzjzoltwttrjli.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

/** Source configurations */
exports.SOURCES = [
  {
    name: 'HSBC',
    url: 'https://www.hsbc.com.hk/credit-cards/'
  },
  {
    name: 'StandardChartered', 
    url: 'https://www.sc.com/hk/en/credit-cards/offers/'
  },
  {
    name: 'BOC',
    url: 'https://www.bochk.com/en/personal/cards/creditcard/promotions.html'
  },
  {
    name: 'HangSeng',
    url: 'https://www.hangseng.com/en-hk/personal/cards/credit-cards/'
  }
]

/** Direct REST API insert with proper auth */
async function insertRawOffer(offer) {
  const response = await fetch(SUPABASE_URL + '/rest/v1/raw_offers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': 'Bearer ' + SERVICE_KEY,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      title: offer.title,
      description: offer.description,
      source: offer.source,
      url: offer.url,
      scraped_at: offer.scraped_at,
      status: 'new'
    })
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error('Insert failed: ' + response.status + ' - ' + error)
  }
  return true
}

/** Fetch HTML */
async function fetchPage(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  })
  if (!response.ok) {
    throw new Error('HTTP ' + response.status)
  }
  return response.text()
}

/** Extract raw items */
function extractItems(html) {
  const items = []
  const seen = new Set()
  
  // Headings
  const headings = html.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi) || []
  for (const h of headings.slice(0, 10)) {
    const text = h.replace(/<[^>]+>/g, '').trim()
    if (text.length > 10 && !seen.has(text)) {
      seen.add(text)
      items.push({ title: text.slice(0, 200), raw: text })
    }
  }
  
  // Paragraphs
  const paragraphs = html.match(/<p[^>]*>([^<]{30,})<\/p>/gi) || []
  for (const p of paragraphs.slice(0, 20)) {
    const text = p.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    if (text.length > 30 && !seen.has(text) && !text.toLowerCase().includes('copyright')) {
      seen.add(text)
      items.push({ title: text.slice(0, 100), raw: text })
    }
  }
  
  return items
}

/** Crawl a source */
async function crawlSource(sourceConfig) {
  const results = { source: sourceConfig.name, found: 0, inserted: 0, errors: [] }
  
  try {
    const html = await fetchPage(sourceConfig.url)
    const items = extractItems(html)
    results.found = items.length
    
    if (items.length === 0) {
      results.errors.push('No items found')
      return results
    }
    
    const now = new Date().toISOString()
    
    for (const item of items) {
      try {
        await insertRawOffer({
          title: item.title,
          description: item.raw.slice(0, 2000),
          source: sourceConfig.name,
          url: sourceConfig.url,
          scraped_at: now
        })
        results.inserted++
      } catch (e) {
        results.errors.push(e.message)
      }
    }
  } catch (e) {
    results.errors.push(e.message)
  }
  
  return results
}

/** Crawl all sources */
exports.crawlAll = async function(sources) {
  sources = sources || exports.SOURCES
  const results = []
  
  for (const source of sources) {
    console.log('Crawling ' + source.name + '...')
    const result = await crawlSource(source)
    results.push(result)
    console.log('  Found: ' + result.found + ', Inserted: ' + result.inserted)
  }
  
  return results
}

/** Get count */
exports.getCrawlSummary = async function() {
  if (!SERVICE_KEY) return { newOffers: 0 }
  const response = await fetch(
    SUPABASE_URL + '/rest/v1/raw_offers?status=eq.new&select=id',
    {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': 'Bearer ' + SERVICE_KEY
      }
    }
  )
  const data = await response.json()
  return { newOffers: Array.isArray(data) ? data.length : 0 }
}
