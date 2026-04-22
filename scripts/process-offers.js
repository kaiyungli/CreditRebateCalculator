/**
 * Run Parser - Process raw offers into structured tables
 * 
 * Usage: node scripts/process-offers.js
 */

const { processAll } = require('../src/services/offerParser')

async function main() {
  console.log('=== Offer Parser v1 ===')
  
  try {
    const results = await processAll()
    console.log('\nProcessed: ' + results.length + ' offers')
  } catch (e) {
    console.error('Failed:', e.message)
    process.exit(1)
  }
  
  console.log('\nDone.')
}

main()
