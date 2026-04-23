/**
 * Offer Crawler v8 - Third-party aggregators
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qcvileuzjzoltwttrjli.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

exports.SOURCES = [
  { name: 'HKCashRebate', url: 'https://hkcashrebate.com/combo' },
  { name: 'FlyForMiles', url: 'https://flyformiles.hk/544/%E9%A3%9F%E9%A3%AF%E4%BF%A1%E7%94%A8%E5%8D%A1%E5%84%AA%E6%83%A0' },
  { name: 'MoneySmart', url: 'https://www.moneysmart.hk/zh-hk/credit-cards' },
  { name: 'HongKongCard', url: 'https://www.hongkongcard.com/cards' },
  { name: 'MrMiles', url: 'https://www.mrmiles.hk/dining-card/' }
]

const NON_OFFER_KEYWORDS = [
  'account', 'payroll', 'mobile app', 'debit card', 'currency',
  'phishing', 'security', 'support', 'login', 'insurance',
  '投資', 'fund', 'stocks', 'bonds', '借貸', 'loan'
]

function isOfferContent(text) {
  const lower = text.toLowerCase()
  for (const kw of NON_OFFER_KEYWORDS) {
    if (lower.includes(kw)) return { valid: false, reason: kw }
  }
  const offerKw = ['回贈', '優惠', 'cashback', '折扣', '里數', 'mile', '迎新', 'bonus']
  for (const kw of offerKw) {
    if (lower.includes(kw)) return { valid: true }
  }
  if (lower.match(/\d+%/) || lower.match(/\$\d+/) || lower.match(/HK\$\d+/)) {
    return { valid: true }
  }
  return { valid: false }
}

async function processSource(source) {
  console.log(`\n📥 ${source.name}`)
  try {
    const res = await fetch(source.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    })
    if (!res.ok) {
      console.log(`   ❌ ${res.status}`)
      return { source: source.name, fetched: 0, extracted: 0, inserted: 0, dup: 0, filtered: 0 }
    }
    const html = await res.text()
    console.log(`   📄 ${html.length} chars`)
    
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
    
    const offers = []
    
    // Extract links with offer keywords
    const patterns = [
      /<a[^>]+href="[^"]*"[^>]*>([^<]*(?:\d+%|[$HK]?\$\d+|回贈|cashback|里數|mile|優惠|折扣)[^<]*)<\/a>/gi,
      /<h[23][^>]*>([^<]*(?:\d+%|[$HK]?\$\d+|回贈|優惠|折扣)[^<]*)<\/h[23]>/gi,
      /class="[^"]*(?:offer|promo|reward|cashback|回贈)[^"]*"[^>]*>([^<]*?)<\/[^>]+>/gi
    ]
    
    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(html)) !== null) {
        const text = match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        if (text.length > 5 && text.length < 150) {
          const { valid } = isOfferContent(text)
          if (valid) offers.push(text.substring(0, 150))
        }
      }
    }
    
    // Dedupe
    const unique = [...new Set(offers)]
    console.log(`   📊 ${unique.length} candidates`)
    
    let inserted = 0, duplicates = 0, filtered = 0
    for (const title of unique) {
      const { data: existing } = await supabase
        .from('raw_offers')
        .select('id')
        .ilike('title', `%${title.substring(0, 30)}%`)
        .limit(1)
      
      if (existing?.length > 0) {
        duplicates++
        continue
      }
      
      const { error } = await supabase
        .from('raw_offers')
        .insert({ title, source_name: source.name })
      
      if (error) filtered++
      else {
        inserted++
        console.log(`   ✅ ${title.substring(0, 60)}`)
      }
    }
    
    console.log(`   📊 Result: inserted=${inserted}, dup=${duplicates}, filtered=${filtered}`)
    return { source: source.name, fetched: 1, extracted: unique.length, inserted, duplicates, filtered }
    
  } catch (e) {
    console.log(`   ❌ ${e.message}`)
    return { source: source.name, fetched: 0, extracted: 0, inserted: 0, dup: 0, filtered: 0 }
  }
}

exports.run = async function() {
  console.log('🎯 Crawler v8 - Aggregators')
  console.log('='.repeat(40))
  
  if (!SERVICE_KEY) {
    console.log('❌ No service key')
    process.exit(1)
  }
  
  const results = []
  for (const source of exports.SOURCES) {
    const r = await processSource(source)
    results.push(r)
    await new Promise(r => setTimeout(r, 2000))
  }
  
  console.log('\n📊 Summary:')
  for (const r of results) {
    console.log(`${r.source}: inserted=${r.inserted}, dup=${r.duplicates}, filtered=${r.filtered}`)
  }
  
  return results
}

if (process.argv[1]?.includes('offerCrawler')) {
  exports.run().then(() => process.exit(0))
}
