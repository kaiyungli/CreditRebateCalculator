#!/usr/bin/env node

/**
 * Process Offers - Main script to ingest and normalize offers
 * 
 * Usage: node scripts/process-offers.js
 * 
 * This script:
 * 1. Fetches raw_offers where status = 'new'
 * 2. Parses each offer text using AI
 * 3. Normalizes and links to merchant/card
 * 4. Updates status in raw_offers
 */

import { createClient } from '@supabase/supabase-js'
import { parseOffer } from '../src/services/offerParser.js'
import { normalizeAndInsert } from '../src/services/offerNormalizer.js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Supabase not configured')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
})

/**
 * Main processing function
 */
async function main() {
  console.log('🚀 Starting offer processing...')
  
  // Step 1: Fetch raw_offers where status = 'new'
  const { data: rawOffers, error: fetchError } = await supabase
    .from('raw_offers')
    .select('*')
    .eq('status', 'new')
    .limit(10)
  
  if (fetchError) {
    console.error('❌ Failed to fetch raw_offers:', fetchError.message)
    process.exit(1)
  }
  
  console.log(`📥 Found ${rawOffers?.length || 0} new offers to process`)
  
  if (!rawOffers || rawOffers.length === 0) {
    console.log('✨ No offers to process')
    return
  }
  
  let processed = 0
  let failed = 0
  
  for (const offer of rawOffers) {
    console.log(`\n📝 Processing offer #${offer.id}: ${offer.title?.substring(0, 50)}...`)
    
    try {
      // Step 2: Combine text
      const text = [offer.title, offer.description]
        .filter(Boolean)
        .join('\n')
      
      console.log('📄 Text:', text.substring(0, 100))
      
      // Step 3: Parse with AI
      const parsed = await parseOffer(text)
      
      if (!parsed) {
        console.log('⚠️ Parse failed - marking as failed')
        await supabase
          .from('raw_offers')
          .update({ status: 'failed' })
          .eq('id', offer.id)
        failed++
        continue
      }
      
      console.log('✅ Parsed:', JSON.stringify(parsed))
      
      // Step 4: Normalize and insert
      const normalized = await normalizeAndInsert(parsed, offer.id)
      
      if (!normalized) {
        console.log('⚠️ Normalize failed - marking as failed')
        await supabase
          .from('raw_offers')
          .update({ status: 'failed' })
          .eq('id', offer.id)
        failed++
        continue
      }
      
      // Step 5: Update status to 'parsed'
      await supabase
        .from('raw_offers')
        .update({ status: 'parsed' })
        .eq('id', offer.id)
      
      console.log('✅ Completed offer #', offer.id)
      processed++
      
    } catch (error) {
      console.error('❌ Error processing offer:', error.message)
      
      // Mark as failed
      await supabase
        .from('raw_offers')
        .update({ status: 'failed' })
        .eq('id', offer.id)
      
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
