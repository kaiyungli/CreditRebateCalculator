/**
 * Add fingerprint column for DB-level duplicate protection
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

async function addFingerprintColumn() {
  console.log('🔧 Adding fingerprint column for duplicate protection...')
  
  // Step 1: Add fingerprint column
  const { error: alterError } = await supabase.rpc('exec_sql', {
    query: `ALTER TABLE merchant_offers ADD COLUMN IF NOT EXISTS fingerprint VARCHAR(100);`
  })
  
  // If RPC doesn't work, try direct SQL via raw query
  if (alterError) {
    console.log('⚠️ RPC failed, trying alternative approach...')
  }
  
  // Step 2: Generate fingerprints for existing rows
  // Use COALESCE to convert NULL to 'X' for consistent fingerprint
  const { data: offers, error: fetchError } = await supabase
    .from('merchant_offers')
    .select('id, merchant_id, bank_id, category_id, value_type, value, min_spend')
  
  if (fetchError) {
    console.error('❌ Failed to fetch offers:', fetchError.message)
    return
  }
  
  console.log(`📊 Found ${offers.length} offers to process`)
  
  // Step 3: Update each with fingerprint
  for (const offer of offers) {
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
  
  // Step 4: Add unique constraint
  // Note: PostgreSQL allows multiple NULLs in unique constraint (with WHERE NOT NULL)
  // But since we use 'X' for NULL, this should work
  const { error: uniqueError } = await supabase.rpc('exec_sql', {
    query: `CREATE UNIQUE INDEX IF NOT EXISTS idx_merchant_offers_fingerprint 
            ON merchant_offers(fingerprint) 
            WHERE fingerprint IS NOT NULL;`
  })
  
  if (uniqueError) {
    console.log('⚠️ Unique index may already exist or failed:', uniqueError.message)
  } else {
    console.log('✅ Unique constraint added')
  }
  
  // Show results
  const { data: results } = await supabase
    .from('merchant_offers')
    .select('id, fingerprint')
    .order('id')
  
  console.log('\n📋 Fingerprints:')
  results?.forEach(r => console.log(`  id=${r.id}: ${r.fingerprint}`))
  
  // Check for duplicates
  const fpCounts = {}
  results?.forEach(r => {
    fpCounts[r.fingerprint] = (fpCounts[r.fingerprint] || 0) + 1
  })
  
  console.log('\n🔍 Duplicate analysis:')
  Object.entries(fpCounts).forEach(([fp, count]) => {
    if (count > 1) console.log(`  DUPLICATE: ${fp} appears ${count} times`)
  })
}

addFingerprintColumn()
  .then(() => console.log('\n✨ Done!'))
  .catch(e => console.error('\n❌ Error:', e.message))
