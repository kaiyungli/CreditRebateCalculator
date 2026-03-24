/**
 * Migration: Add fingerprint-based duplicate protection
 * 
 * This migration:
 * 1. Adds fingerprint column
 * 2. Generates fingerprints for all rows
 * 3. Removes duplicates (keeps lowest ID)
 * 4. Adds unique index
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Supabase not configured')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
})

async function migrate() {
  console.log('🚀 Starting fingerprint migration...\n')
  
  // Step 1: Add fingerprint column
  console.log('📝 Step 1: Adding fingerprint column...')
  try {
    await supabase.from('merchant_offers').select('fingerprint').limit(1)
    console.log('✅ Column already exists')
  } catch (e) {
    // Column doesn't exist - we'd need direct SQL
    console.log('⚠️ Cannot add column via API - need SQL:')
    console.log('   ALTER TABLE merchant_offers ADD COLUMN fingerprint VARCHAR(100);')
  }
  
  // Step 2: Get all offers and generate fingerprints
  console.log('\n📝 Step 2: Processing existing offers...')
  const { data: offers, error } = await supabase
    .from('merchant_offers')
    .select('id, merchant_id, bank_id, category_id, value_type, value, min_spend')
    .order('id')
  
  if (error) {
    console.error('❌ Failed to fetch offers:', error.message)
    return
  }
  
  console.log(`   Found ${offers.length} offers`)
  
  // Generate fingerprints and group
  const fingerprintMap = new Map()
  
  for (const offer of offers) {
    const fp = [
      offer.merchant_id || 'X',
      offer.bank_id,
      offer.category_id || 'X',
      offer.value_type,
      offer.value,
      offer.min_spend || 0
    ].join('_')
    
    if (!fingerprintMap.has(fp)) {
      fingerprintMap.set(fp, [])
    }
    fingerprintMap.get(fp).push(offer.id)
  }
  
  // Step 3: Find and remove duplicates
  console.log('\n📝 Step 3: Analyzing duplicates...')
  let duplicateCount = 0
  const duplicatesToRemove = []
  
  for (const [fp, ids] of fingerprintMap.entries()) {
    if (ids.length > 1) {
      console.log(`   Duplicate: ${fp}`)
      console.log(`      IDs: ${ids.join(', ')}`)
      console.log(`      Keeping: ${ids[0]}, Removing: ${ids.slice(1).join(', ')}`)
      
      // Keep first ID (lowest), remove rest
      duplicatesToRemove.push(...ids.slice(1))
      duplicateCount += ids.length - 1
    }
  }
  
  if (duplicatesToRemove.length > 0) {
    console.log(`\n📝 Step 4: Removing ${duplicatesToRemove.length} duplicate rows...`)
    
    // Delete duplicates (keep lowest ID)
    for (const id of duplicatesToRemove) {
      await supabase.from('merchant_offers').delete().eq('id', id)
    }
    console.log('✅ Duplicates removed')
  } else {
    console.log('\n✅ No duplicates found')
  }
  
  // Step 5: Update fingerprints for remaining rows
  console.log('\n📝 Step 5: Generating fingerprints...')
  const { data: remainingOffers } = await supabase
    .from('merchant_offers')
    .select('id, merchant_id, bank_id, category_id, value_type, value, min_spend')
    .order('id')
  
  for (const offer of remainingOffers) {
    const fp = [
      offer.merchant_id || 'X',
      offer.bank_id,
      offer.category_id || 'X',
      offer.value_type,
      offer.value,
      offer.min_spend || 0
    ].join('_')
    
    await supabase
      .from('merchant_offers')
      .update({ fingerprint: fp })
      .eq('id', offer.id)
  }
  console.log('✅ Fingerprints generated')
  
  // Step 6: Final count
  const { count } = await supabase
    .from('merchant_offers')
    .select('id', { count: 'exact', head: true })
  
  console.log(`\n✨ Migration complete! ${count} unique offers remain.`)
  console.log('\n📋 To add DB constraint, run in SQL Editor:')
  console.log('   CREATE UNIQUE INDEX idx_merchant_offers_fingerprint')
  console.log('   ON merchant_offers(fingerprint)')
  console.log('   WHERE fingerprint IS NOT NULL;')
}

migrate()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('\n❌ Migration failed:', e.message)
    process.exit(1)
  })
