#!/usr/bin/env node

/**
 * Process Offers - Main script to ingest and normalize offers
 * 
 * Usage: node scripts/process-offers.js
 * 
 * This script:
 * 1. Fetches raw offers from sources (manual input for now)
 * 2. Parses each offer text
 * 3. Normalizes and links to merchant/card
 * 4. Inserts into merchant_offers table
 */

import { parseOffer } from '../src/services/offerParser.js'
import { normalizeAndInsert } from '../src/services/offerNormalizer.js'

/**
 * Main processing function
 */
async function main() {
  console.log('🚀 Starting offer processing...')
  
  // TODO: Fetch raw offers from sources
  // For now, just process sample data
  const sampleOffers = [
    {
      text: 'HSBC信用卡 - 壽司郎消費滿HK$500即減HK$50',
      source: 'manual'
    },
    {
      text: '中銀信用卡 - 超市消費2%回贈',
      source: 'manual'
    }
  ]
  
  let processed = 0
  let failed = 0
  
  for (const offer of sampleOffers) {
    try {
      console.log(`\n📝 Processing: ${offer.text}`)
      
      // Step 1: Parse
      const parsed = await parseOffer(offer.text)
      console.log('   ✅ Parsed:', parsed.title || parsed.merchant_name)
      
      // Step 2: Normalize and insert
      const normalized = await normalizeAndInsert(parsed)
      console.log('   ✅ Inserted:', normalized.id)
      
      processed++
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`)
      failed++
    }
  }
  
  console.log(`\n📊 Done! Processed: ${processed}, Failed: ${failed}`)
}

// Run if called directly
main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
