/**
 * Offer Crawler - Raw Collection Only
 * 
 * Collects raw offer data from public sources
 * Does NOT parse offer meaning (no bank_id, card_id, value, etc.)
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qcvileuzjzoltwttrjli.supabase.co'
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getClient() {
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase config')
  }
  return createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
}

/** Source configurations - public offer pages */
export const SOURCES = [
  {
    name: 'HSBC',
    url: 'https://www.hsbc.com.hk/credit-cards/',
    titleSelector: 'h1, h2, h3',
    descSelector: 'p',
    itemSelector: 'article, .promotion, .offer'
  },
  {
    name: 'Citi',
    url: 'https://www.citibank.com.hk/sgc/cards/credit-cards/offers/',
    titleSelector: 'h1, h2, h3',
    descSelector: 'p',
    itemSelector: 'article, .promo, .offer'
  },
  {
    name: 'StandardChartered',
    url: 'https://www.sc.com/hk/en/credit-cards/offers/',
    titleSelector: 'h1, h2, h3',
    descSelector: 'p',
    itemSelector: 'article, .promo, .offer'
  },
  {
    name: 'BOC',
    url: 'https://www.bochk.com/en/personal/cards/creditcard/promotions.html',
    titleSelector: 'h1, h2, h3',
    descSelector: 'p',
    itemSelector: 'article, .promotion, .offer'
  },
  {
    name: 'HangSeng',
    url: 'https://www.hangseng.com/en-hk/personal/cards/credit-cards/',
    titleSelector: 'h1, h2, h3',
    descSelector: 'p',
    itemSelector: 'article, .promotion, .offer'
  }
]

/** Fetch a single page */
async function fetchPage(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  
  return response.text()
}

/** Extract items using simple heuristics */
function extractItems(html, sourceName) {
  const items = []
  
  // Extract headings and paragraphs
  const headingMatches = html.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi) || []
  const paraMatches = html.match(/<p[^>]*>([^<]{30,})<\/p>/gi) || []
  
  // Combine with unique text
  const seen = new Set()
  
  for (const h of headingMatches.slice(0, 10)) {
    const text = h.replace(/<[^>]+>/g, '').trim()
    if (text.length > 10 && !seen.has(text)) {
      seen.add(text)
      items.push({ title: text.slice(0, 200), raw: text })
    }
  }
  
  for (const p of paraMatches.slice(0, 20)) {
    const text = p.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    if (text.length > 30 && !seen.has(text) && !text.toLowerCase().includes('copyright')) {
      seen.add(text)
      items.push({ title: text.slice(0, 100), raw: text })
    }
  }
  
  return items
}

/** Crawl a single source */
async function crawlSource(sourceConfig) {
  const results = { source: sourceConfig.name, found: 0, inserted: 0, errors: [] }
  
  try {
    const html = await fetchPage(sourceConfig.url)
    const items = extractItems(html, sourceConfig.name)
    results.found = items.length
    
    if (items.length === 0) {
      results.errors.push('No items found')
      return results
    }
    
    const supabase = getClient()
    const now = new Date().toISOString()
    
    for (const item of items) {
      // Store as raw text only - NO parsing
      const { error } = await supabase.from('raw_offers').insert({
        title: item.title,
        description: item.raw.slice(0, 2000),
        source: sourceConfig.name,
        url: sourceConfig.url,
        scraped_at: now,
        status: 'new'
      })
      
      if (error) {
        results.errors.push(error.message)
      } else {
        results.inserted++
      }
    }
  } catch (e) {
    results.errors.push(e.message)
  }
  
  return results
}

/** Crawl all sources */
export async function crawlAll(sources = SOURCES) {
  const results = []
  
  for (const source of sources) {
    console.log(`Crawling ${source.name}...`)
    const result = await crawlSource(source)
    results.push(result)
    console.log(`  Found: ${result.found}, Inserted: ${result.inserted}`)
  }
  
  return results
}

/** Summary */
export async function getCrawlSummary() {
  const supabase = getClient()
  const { count } = await supabase
    .from('raw_offers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'new')
  
  return { newOffers: count || 0 }
}

export default { SOURCES, crawlAll, getCrawlSummary }
