/**
 * Offer Normalizer - Match offers to merchants/cards and insert into DB
 * 
 * Input: parsed offer from parser
 * Output: normalized offer linked to merchant/card in DB
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  throw new Error('Supabase not configured')
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
})

// Ensure fingerprint column exists
async function ensureFingerprintColumn() {
  try {
    // Try to add column (will fail silently if exists)
    await supabase.from('merchant_offers').select('fingerprint').limit(1)
  } catch (e) {
    // Column doesn't exist - we'd need schema migration
    console.log('⚠️ fingerprint column may not exist in DB')
  }
}

// Run on module load
ensureFingerprintColumn()

/**
 * Normalize parsed offer and insert into database
 * @param {Object} parsed - Parsed offer from offerParser
 * @param {number} rawOfferId - Original raw offer ID (if exists)
 * @returns {Promise<Object|null>} Normalized offer with DB IDs or null
 */
export async function normalizeAndInsert(parsed, rawOfferId = null) {
  // Step 1: Validate parsed
  console.log('📥 normalizeAndInsert called with:', JSON.stringify(parsed))
  
  if (!parsed) {
    console.log('⚠️ No parsed data')
    return null
  }

  if (!parsed.reward_type || !parsed.reward_value) {
    console.log('⚠️ Missing reward_type or reward_value')
    return null
  }

  // Step 2: Match bank
  let bankId = null
  if (parsed.bank) {
    const { data: banks } = await supabase
      .from('banks')
      .select('id, name')
      .ilike('name', `%${parsed.bank}%`)
      .limit(1)
    
    bankId = banks?.[0]?.id || null
    console.log(`🏦 Bank match: "${parsed.bank}" → id: ${bankId}`)
  }

  // Step 3: Match merchant
  let merchantId = null
  if (parsed.merchant_name) {
    const { data: merchants } = await supabase
      .from('merchants')
      .select('id, name')
      .ilike('name', `%${parsed.merchant_name}%`)
      .limit(1)
    
    merchantId = merchants?.[0]?.id || null
    console.log(`🏪 Merchant match: "${parsed.merchant_name}" → id: ${merchantId}`)
  }

  // Step 4: Match category
  let categoryId = null
  if (parsed.category) {
    // Map English category names to Chinese
    const categoryMap = {
      'dining': '餐飲',
      'supermarket': '超市', 
      'online': '網購',
      'entertainment': '娛樂',
      'travel': '旅行',
      'fuel': '油站',
      'transport': '交通'
    }
    const chineseName = categoryMap[parsed.category.toLowerCase()] || parsed.category
    
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name')
      .ilike('name', `%${chineseName}%`)
      .limit(1)
    
    categoryId = categories?.[0]?.id || null
    console.log(`📂 Category match: "${parsed.category}" (${chineseName}) → id: ${categoryId}`)
  }

  // Step 5: Match card
  let cardId = null
  if (parsed.card) {
    const { data: cards } = await supabase
      .from('cards')
      .select('id, name, bank_id')
      .ilike('name', `%${parsed.card}%`)
      .limit(1)
    
    cardId = cards?.[0]?.id || null
    
    // Use bank from card if not matched
    if (!bankId && cards?.[0]?.bank_id) {
      bankId = cards[0].bank_id
    }
    console.log(`💳 Card match: "${parsed.card}" → id: ${cardId}`)
  }

  // Step 6: Build payload with fingerprint for dedup
  const fingerprint = [
    merchantId || 'X',
    bankId,
    categoryId || 'X',
    parsed.reward_type,
    parsed.reward_value,
    parsed.min_spend || 0
  ].join('_')
  
  const payload = {
    fingerprint,
    merchant_id: merchantId,
    bank_id: bankId,
    card_id: cardId,
    category_id: categoryId,
    title: parsed.merchant_name || parsed.category || 'Unknown Offer',
    description: null,
    offer_type: parsed.reward_type === 'PERCENT' ? 'EXTRA_CASHBACK' : 'COUPON',
    value_type: parsed.reward_type,
    value: parsed.reward_value,
    min_spend: parsed.min_spend || null,
    max_discount: parsed.cap_amount || null,
    valid_from: null,
    valid_to: null,
    source: 'ai_parsed',
    is_verified: false,
    status: 'ACTIVE'
  }

  console.log('📦 Payload:', JSON.stringify(payload))

  // Step 7: Upsert into merchant_offers with duplicate protection
  // Use unique constraint on: merchant_id, bank_id, category_id, value_type, value, min_spend
  try {
    // Build unique key fields (exclude null values for consistency)
    const merchantKey = payload.merchant_id || 'NULL'
    const categoryKey = payload.category_id || 'NULL'
    const uniqueKey = `${merchantKey}-${payload.bank_id}-${categoryKey}-${payload.value_type}-${payload.value}-${payload.min_spend || 0}`
    
    // Check if offer already exists
    const { data: existing } = await supabase
      .from('merchant_offers')
      .select('id, status')
      .eq('merchant_id', payload.merchant_id || null)
      .eq('bank_id', payload.bank_id)
      .eq('category_id', payload.category_id || null)
      .eq('value_type', payload.value_type)
      .eq('value', payload.value)
      .eq('min_spend', payload.min_spend || null)
      .limit(1)
    
    if (existing && existing.length > 0) {
      // Offer exists - update status to ACTIVE if it was inactive
      if (existing[0].status !== 'ACTIVE') {
        await supabase
          .from('merchant_offers')
          .update({ status: 'ACTIVE', updated_at: new Date().toISOString() })
          .eq('id', existing[0].id)
        console.log('✅ Reactivated existing offer:', existing[0].id)
      } else {
        console.log('⏭️ Duplicate offer skipped:', existing[0].id)
      }
      return { id: existing[0].id, duplicate: true }
    }
    
    const insertData = {
      fingerprint: payload.fingerprint,
      bank_id: payload.bank_id,
      card_id: payload.card_id,
      title: payload.title,
      offer_type: payload.offer_type,
      value_type: payload.value_type,
      value: payload.value,
      min_spend: payload.min_spend || null,
      max_reward: payload.max_discount,
      source: payload.source,
      status: payload.status,
      valid_from: payload.valid_from,
      valid_to: payload.valid_to
    }
    
    // Only include merchant_id if not null
    if (payload.merchant_id) {
      insertData.merchant_id = payload.merchant_id
    }
    // Only include category_id if not null
    if (payload.category_id) {
      insertData.category_id = payload.category_id
    }
    
    const { data, error } = await supabase
      .from('merchant_offers')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('❌ Upsert failed:', error.message)
      return null
    }

    console.log('✅ Inserted offer:', data.id)
    return data

  } catch (error) {
    console.error('❌ Error inserting offer:', error.message)
    return null
  }
}

/**
 * Find merchant by name (fuzzy match)
 */
async function findMerchantByName(merchantName) {
  if (!merchantName) return null
  
  const { data } = await supabase
    .from('merchants')
    .select('id, name')
    .ilike('name', `%${merchantName}%`)
    .limit(1)
  
  return data?.[0]?.id || null
}

/**
 * Find card by name or bank name
 */
async function findCardByName(cardName) {
  if (!cardName) return { card_id: null, bank_id: null }
  
  const { data } = await supabase
    .from('cards')
    .select('id, bank_id, name')
    .ilike('name', `%${cardName}%`)
    .limit(1)
  
  return {
    card_id: data?.[0]?.id || null,
    bank_id: data?.[0]?.bank_id || null
  }
}

/**
 * Find category by keywords
 */
async function findCategoryByKeywords(text) {
  if (!text) return null
  
  const { data } = await supabase
    .from('categories')
    .select('id, name')
    .ilike('name', `%${text}%`)
    .limit(1)
  
  return data?.[0]?.id || null
}

/**
 * Validate parsed offer data
 */
function validateParsedOffer(parsed) {
  if (!parsed) return { valid: false, errors: ['No parsed data'] }
  
  const errors = []
  
  if (!parsed.reward_type) errors.push('Missing reward_type')
  if (!parsed.reward_value) errors.push('Missing reward_value')
  
  return { valid: errors.length === 0, errors }
}

export default { normalizeAndInsert }
