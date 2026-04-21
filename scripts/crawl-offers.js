/**
 * Run Crawler - Insert raw offers into raw_offers
 * 
 * Usage: node scripts/crawl-offers.js
 * 
 * Only crawls public pages and stores raw text.
 * No parsing, no structured fields.
 */

const { crawlAll, getCrawlSummary, SOURCES } = require('../src/services/offerCrawler')

async function main() {
  console.log('=== Offer Crawler v1 ===\n')
  console.log('Sources:', SOURCES.map(s => s.name).join(', '))
  console.log('')
  
  try {
    const results = await crawlAll()
    
    console.log('\n=== Crawl Summary ===')
    let totalFound = 0
    let totalInserted = 0
    
    for (const r of results) {
      console.log(`${r.source}: found=${r.found}, inserted=${r.inserted}`)
      if (r.errors.length > 0) {
        console.log(`  Errors: ${r.errors.join(', ')}`)
      }
      totalFound += r.found
      totalInserted += r.inserted
    }
    
    console.log('')
    console.log(`Total: found=${totalFound}, inserted=${totalInserted}`)
    
    const summary = await getCrawlSummary()
    console.log(`New raw offers in DB: ${summary.newOffers}`)
    
  } catch (e) {
    console.error('Crawl failed:', e.message)
    process.exit(1)
  }
  
  console.log('\nDone.')
}

main()
