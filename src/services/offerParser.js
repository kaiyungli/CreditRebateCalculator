/**
 * Offer Parser - Extract structured data from raw offer text
 * 
 * Input: raw offer text from scraping/sources
 * Output: parsed structured offer object
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
 * Parse raw offer text into structured data
 * @param {string} text - Raw offer text
 * @returns {Promise<Object>} Parsed offer object
 */
export async function parseOffer(text) {
  // TODO: Implement parsing logic
  // - Extract merchant name
  // - Extract reward value (fixed/percent)
  // - Extract min_spend requirement
  // - Extract valid dates
  // - Extract terms and conditions
  
  const parsed = {
    merchant_name: null,
    title: null,
    description: null,
    offer_type: null,
    value_type: null,
    value: null,
    min_spend: null,
    max_discount: null,
    valid_from: null,
    valid_to: null,
    card_id: null,
    bank_id: null,
    category_id: null,
    source: 'manual',
    is_verified: false,
    status: 'ACTIVE'
  }
  
  return parsed
}

/**
 * Detect offer type from text
 */
function detectOfferType(text) {
  // TODO: Implement
  // COUPON, CASH_DISCOUNT, EXTRA_CASHBACK, etc.
  return 'COUPON'
}

/**
 * Extract monetary values from text
 */
function extractMoney(text) {
  // TODO: Implement - parse HK$500, $500, 500港幣, etc.
  return null
}

/**
 * Extract percentage values from text
 */
function extractPercentage(text) {
  // TODO: Implement - parse 5%, 5 percent, etc.
  return null
}

/**
 * Extract date ranges from text
 */
function extractDates(text) {
  // TODO: Implement - parse dates from offer terms
  return { from: null, to: null }
}

export default { parseOffer }
