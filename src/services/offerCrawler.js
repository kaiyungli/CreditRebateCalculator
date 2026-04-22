/**
 * Offer Crawler - Raw Collection Only v5
 * 
 * With improved source selection and non-offer filtering
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qcvileuzjzoltwttrjli.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

/** 
 * Better source URLs - specific promotion/offer pages 
 * Not broad "credit-cards" landing pages
 */
exports.SOURCES = [
  {
    name: 'HSBC_RedHot',
    url: 'https://www.redhotoffers.hsbc.com.hk/en/home/'
  },
  {
    name: 'HSBC_Promotions', 
    url: 'https://www.hsbc.com.hk/credit-cards/en/promotions/'
  }
]

/** Non-offer keywords to filter out */
const NON_OFFER_KEYWORDS = [
  'account', 'payroll', 'mobile app', 'debit card', 'currency',
  'phishing', 'security', 'support', 'help', 'login',
  'all-in-one', 'employee banking', 'beware', 'fraud',
  'currency &', 'rmb', 'exchange rate'
]

/** Check if content is likely an offer */
function isOfferContent(title, description) {
  const text = (title + ' ' + (description || '')).toLowerCase()
  
  // Check for non-offer keywords
  for (const keyword of NON_OFFER_KEYWORDS) {
    if (text.includes(keyword.toLowerCase())) {
      return { valid: false, reason: 'non_offer_keyword:' + keyword }
    }
  }
  
  // Check for offer-like keywords (must have at least one)
  const offerKeywords = [
    'offer', 'reward', 'cashback', 'discount', 'promotion',
    'spend', 'dining', 'shopping', 'travel', 'mile',
    'welcome', 'bonus', 'gift', 'privilege', 'exclusive'
  ]
  
  let hasOfferKeyword = false
  for (const keyword of offerKeywords) {
    if (text.includes(keyword)) {
      hasOfferKeyword = true
      break
    }
  }
  
  // If no offer keyword but has numeric value like %, $ - likely offer
  if (!hasOfferKeyword && (text.match(/\d+%/) || text.match(/\$\d+/) || text.match(/HK\$/))) {
    hasOfferKeyword = true
  }
  
  if (!hasOfferKeyword) {
    return { valid: false, reason: 'no_offer_keyword' }
  }
  
  return { valid: true }
}

/** Check if title already exists */
async function checkDuplicate(title, source) {
  if (!SERVICE_KEY) return false
  const response = await fetch(
    SUPABASE_URL + '/rest/v1/raw_offers?title=eq.' + encodeURIComponent(title.substring(0,200)) + '&source=eq.' + source + '&select=id&limit=1',
    {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': 'Bearer ' + SERVICE_KEY
      }
    }
  )
  const data = await response.json()
  return Array.isArray(data) && data.length > 0
}

/** Insert with filtering */
async function insertRawOffer(offer) {
  // Check for duplicate
  const isDuplicate = await checkDuplicate(offer.title, offer.source)
  if (isDuplicate) {
    return { inserted: false, reason: 'duplicate' }
  }
  
  // Check if it's offer content
  const check = isOfferContent(offer.title, offer.description)
  if (!check.valid) {
    return { inserted: false, reason: check.reason }
  }
  
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
  return { inserted: true }
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

/** Extract raw items with better selectors */
function extractItems(html) {
  const items = []
  const seen = new Set()
  
  // Look for offer-specific elements
  // Promotional headings
  const promoHeadings = html.match(/<h[1-3][^>]*>([^<]{20,})<\/h[1-3]>/gi) || []
  for (const h of promoHeadings.slice(0, 15)) {
    const text = h.replace(/<[^>]+>/g, '').trim()
    if (text.length > 15 && !seen.has(text)) {
      seen.add(text)
      items.push({ title: text.slice(0, 200), raw: text })
    }
  }
  
  // Promotional paragraphs
  const promoParagraphs = html.match(/<p[^>]*>([^<]{40,})<\/p>/gi) || []
  for (const p of promoParagraphs.slice(0, 25)) {
    const text = p.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    // Only keep if has offer-like keywords or values
    if (text.length > 40 && !seen.has(text)) {
      const check = isOfferContent(text, '')
      if (check.valid) {
        seen.add(text)
        items.push({ title: text.slice(0, 120), raw: text })
      }
    }
  }
  
  return items
}

/** Crawl a source */
async function crawlSource(sourceConfig) {
  const results = { source: sourceConfig.name, found: 0, inserted: 0, skipped: 0, filtered: 0, errors: [] }
  
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
        const result = await insertRawOffer({
          title: item.title,
          description: item.raw.slice(0, 2000),
          source: sourceConfig.name,
          url: sourceConfig.url,
          scraped_at: now
        })
        if (result.inserted) {
          results.inserted++
        } else if (result.reason === 'duplicate') {
          results.skipped++
        } else {
          results.filtered++
        }
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
    console.log('  Found: ' + result.found + ', Inserted: ' + result.inserted + ', Skipped: ' + result.skipped + ', Filtered: ' + result.filtered)
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
