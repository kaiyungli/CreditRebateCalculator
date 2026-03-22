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

/**
 * Normalize parsed offer and insert into database
 * @param {Object} parsed - Parsed offer from offerParser
 * @param {number} rawOfferId - Original raw offer ID (if exists)
 * @returns {Promise<Object>} Normalized offer with DB IDs
 */
export async function normalizeAndInsert(parsed, rawOfferId = null) {
  // TODO: Implement normalization logic
  // 1. Find matching merchant by name (fuzzy match)
  // 2. Find matching card by bank/card name
  // 3. Find matching category
  // 4. Validate and transform data
  // 5. Insert into merchant_offers table
  
  const normalized = {
    merchant_id: null,
    card_id: parsed.card_id || null,
    bank_id: parsed.bank_id || null,
    category_id: parsed.category_id || null,
    title: parsed.title,
    description: parsed.description,
    offer_type: parsed.offer_type,
    value_type: parsed.value_type,
    value: parsed.value,
    min_spend: parsed.min_spend,
    max_discount: parsed.max_discount,
    valid_from: parsed.valid_from,
    valid_to: parsed.valid_to,
    source: parsed.source || 'manual',
    is_verified: parsed.is_verified || false,
    status: 'ACTIVE'
  }
  
  // Insert into DB
  const { data, error } = await supabase
    .from('merchant_offers')
    .insert(normalized)
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to insert offer: ${error.message}`)
  }
  
  return data
}

/**
 * Find merchant by name (fuzzy match)
 */
async function findMerchantByName(merchantName) {
  // TODO: Implement
  // - Exact match first
  // - Then fuzzy match on aliases
  // - Return merchant ID or null
  
  return null
}

/**
 * Find card by name or bank name
 */
async function findCardByName(cardName) {
  // TODO: Implement
  // - Search cards table by name
  // - Search banks table by name
  // - Return card_id and bank_id
  
  return { card_id: null, bank_id: null }
}

/**
 * Find category by keywords
 */
async function findCategoryByKeywords(text) {
  // TODO: Implement
  // - Match against category keywords
  // - Return category_id or null
  
  return null
}

/**
 * Validate parsed offer data
 */
function validateParsedOffer(parsed) {
  // TODO: Implement validation
  // - Required fields
  // - Value ranges
  // - Date logic
  
  return { valid: true, errors: [] }
}

export default { normalizeAndInsert }
