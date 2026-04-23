/**
 * Offer Crawler - Raw Collection Only v7
 * 
 * Expanded sources - working URLs found via search
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qcvileuzjzoltwttrjli.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

/** 
 * Working source list via search
 */
exports.SOURCES = [
  {
    name: 'HSBC_RedHot',
    url: 'https://www.redhotoffers.hsbc.com.hk/en/home/'
  },
  {
    name: 'HSBC_Offers',
    url: 'https://www.hsbc.com/offers/'
  },
  {
    name: 'HSBC_Cards',
    url: 'https://www.hsbc.com.hk/credit-cards/'
  },
  {
    name: 'HangSeng_Cards',
    url: 'https://www.hangseng.com/en/credit-cards/'
  },
  {
    name: 'BOC_Cards',
    url: 'https://www.boc.hk/en/credit-cards/'
  }
]

/** Non-offer keywords to filter out */
const NON_OFFER_KEYWORDS = [
  'account', 'payroll', 'mobile app', 'debit card', 'currency',
  'phishing', 'security', 'support', 'help', 'login',
  'all-in-one', 'employee banking', 'beware', 'fraud',
  'currency &', 'rmb', 'exchange rate', 'insurance',
  'investment', 'fund', 'stocks', 'bonds'
]

/** Check if content is likely an offer */
function isOfferContent(title, description) {
  const text = (title + ' ' + (description || '')).toLowerCase()
  
  for (const keyword of NON_OFFER_KEYWORDS) {
    if (text.includes(keyword.toLowerCase())) {
      return { valid: false, reason: 'non_offer_keyword:' + keyword }
    }
  }
  
  const offerKeywords = [
    'offer', 'reward', 'cashback', 'discount', 'promotion',
    'spend', 'dining', 'shopping', 'travel', 'mile',
    'welcome', 'bonus', 'gift', 'privilege', 'exclusive', '回贈'
  ]
  
  let hasOfferKeyword = false
  for (const keyword of offerKeywords) {
    if (text.includes(keyword)) {
      hasOfferKeyword = true
      break
    }
  }
  
  if (!hasOfferKeyword && (text.match(/\d+%/) || text.match(/\$\d+/) || text.match(/HK\$/) || text.match(/\d+% off/))) {
    hasOfferKeyword = true
  }
  
  return { valid: hasOfferKeyword, reason: hasOfferKeyword ? 'valid' : 'no_offer_keyword' }
}

/** Process single source */
async function processSource(source) {
  console.log(`\n📥 Processing: ${source.name}`)
  console.log(`   URL: ${source.url}`)
  
  try {
    const res = await fetch(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CreditRebateBot/1.0)'
      }
    })
    
    if (!res.ok) {
      console.log(`   ❌ Fetch failed: ${res.status}`)
      return { source: source.name, fetched: 0, extracted: 0, inserted: 0, filtered: 0, duplicates: 0 }
    }
    
    const html = await res.text()
    console.log(`   📄 Fetched ${html.length} chars`)
    
    const offers = []
    
    // Look for offer-like links and text
    const patterns = [
      /<a[^>]+href="[^"]*"[^>]*>([^<]*(?:offer|cashback|discount|promotion|回贈|優惠|獎賞|mile|回贈)[^<]*)<\/a>/gi,
      /<h[1-4][^>]*>([^<]*(?:offer|cashback|discount|promotion|回贈|優惠)[^<]*)<\/h[1-4]>/gi,
      /<p[^>]*>([^<]*(?:\d+% off|\$\d+|HK\$\d+)[^<]*)<\/p>/gi
    ]
    
    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(html)) !== null) {
        const text = match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        if (text.length > 8 && text.length < 200) {
          const { valid, reason } = isOfferContent(text, '')
          if (valid) {
            offers.push({ title: text.substring(0, 150), source: source.name, url: source.url })
          }
        }
      }
    }
    
    // Extract from JSON data in page
    const jsonData = html.match(/\[[\s\S]*?"title"[\s\S]*?\]/g)
    if (jsonData) {
      for (const block of jsonData) {
        const titles = block.match(/"title"\s*:\s*"([^"]+)"/g)
        if (titles) {
          for (const t of titles) {
            const title = t.replace(/"title"\s*:\s*"/, '').replace(/"$/, '').trim()
            if (title.length > 5) {
              const { valid } = isOfferContent(title, '')
              if (valid) offers.push({ title, source: source.name, url: source.url })
            }
          }
        }
      }
    }
    
    // Dedupe
    const unique = new Map()
    for (const o of offers) {
      const key = o.title.toLowerCase().substring(0, 50)
      if (!unique.has(key)) unique.set(key, o)
    }
    const deduped = Array.from(unique.values())
    
    console.log(`   📊 Extracted: ${deduped.length} unique offers`)
    
    // Insert to DB
    let inserted = 0, duplicates = 0, filtered = 0
    if (deduped.length > 0 && SERVICE_KEY) {
      for (const o of deduped) {
        const { data: existing } = await exports.supabase
          .from('raw_offers')
          .select('id')
          .eq('title', o.title)
          .limit(1)
          
        if (existing?.length > 0) {
          duplicates++
          continue
        }
        
        const { error } = await exports.supabase
          .from('raw_offers')
          .insert({
            title: o.title,
            source_name: o.source,
            source_url: o.url,
            status: 'new',
            raw_content: o.title
          })
          
        if (!error) inserted++
        else filtered++
      }
    }
    
    console.log(`   ✅ Inserted: ${inserted}, Duplicates: ${duplicates}, Filtered: ${filtered}`)
    return { source: source.name, fetched: 1, extracted: deduped.length, inserted, filtered, duplicates }
    
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`)
    return { source: source.name, fetched: 0, extracted: 0, inserted: 0, filtered: 0, duplicates: 0 }
  }
}

/** Run all sources */
exports.run = async function() {
  console.log('🎯 Crawler v7 - Working Sources')
  console.log('='.repeat(40))
  
  if (!SERVICE_KEY) {
    console.log('❌ SUPABASE_SERVICE_ROLE_KEY not set')
    process.exit(1)
  }
  
  const { createClient } = await import('@supabase/supabase-js')
  exports.supabase = createClient(SUPABASE_URL, SERVICE_KEY)
  
  const results = []
  for (const source of exports.SOURCES) {
    const r = await processSource(source)
    results.push(r)
    await new Promise(r => setTimeout(r, 1500)) // delay
  }
  
  console.log('\n📊 Summary:')
  console.log('='.repeat(40))
  for (const r of results) {
    console.log(`${r.source}: extracted=${r.extracted}, inserted=${r.inserted}, dup=${r.duplicates}, filtered=${r.filtered}`)
  }
  
  return results
}

// Run if called directly
if (process.argv[1]?.includes('offerCrawler')) {
  exports.run().then(() => process.exit(0))
}
