// Offers helper functions - uses server-side Supabase client
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL not set')
  }
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not set')
  }
  
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
}

/**
 * Get active offers with filters
 */
export async function getActiveOffers({ merchantName, cardId, categoryId, date, amount, isVerified = false } = {}) {
  const supabase = getSupabase()
  const checkDate = date || new Date().toISOString().split('T')[0]
  
  let query = supabase
    .from('merchant_offers')
    .select('*')
    .eq('status', 'ACTIVE')
    .lte('valid_from', checkDate)
    .gte('valid_to', checkDate)
  
  if (merchantName) query = query.ilike('merchant_name', `%${merchantName}%`)
  if (cardId) query = query.or(`card_id.eq.${cardId},card_id.is.null`)
  if (categoryId) query = query.or(`category_id.eq.${categoryId},category_id.is.null`)
  if (isVerified) query = query.eq('is_verified', true)
  
  const { data, error } = await query
  if (error) throw new Error(`Database query failed: ${error.message}`)
  
  let offers = data || []
  if (amount) offers = offers.filter(o => !o.min_spend || amount >= o.min_spend)
  return offers
}

/**
 * Get all active offers (for listing page)
 */
export async function getAllActiveOffers(limit = 50) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('merchant_offers')
    .select('*')
    .eq('status', 'ACTIVE')
    .lte('valid_from', new Date().toISOString().split('T')[0])
    .gte('valid_to', new Date().toISOString().split('T')[0])
    .limit(limit)
  if (error) throw new Error(`Database query failed: ${error.message}`)
  return data || []
}

/**
 * Calculate offer value for a given amount
 */
export function calculateOfferValue(offer, spendAmount) {
  if (!offer || !spendAmount) return 0
  if (offer.min_spend && spendAmount < offer.min_spend) return 0

  let value = 0
  if (offer.value_type === 'PERCENT' || offer.value_type === 'PERCENTAGE') {
    value = spendAmount * (offer.value / 100)
  } else if (offer.value_type === 'FIXED') {
    value = offer.value
  } else if (offer.value_type === 'PER_SPEND') {
    value = Math.floor(spendAmount / (offer.min_spend || 100)) * offer.value
  }
  if (offer.max_discount && value > offer.max_discount) value = offer.max_discount
  return Math.round(value * 100) / 100
}

/**
 * Get applicable offers and their values for a transaction
 */
export function getApplicableOffers(offers, spendAmount) {
  if (!offers || offers.length === 0) return []
  return offers
    .filter(o => !o.min_spend || spendAmount >= o.min_spend)
    .map(o => ({ ...o, calculatedValue: calculateOfferValue(o, spendAmount) }))
    .filter(o => o.calculatedValue > 0)
    .sort((a, b) => b.calculatedValue - a.calculatedValue)
}

/**
 * Get the best stackable offer
 */
export function getBestStackableOffer(offers, spendAmount) {
  const applicable = getApplicableOffers(offers, spendAmount)
  const stackable = applicable.find(o => o.stackable)
  if (stackable) return stackable
  return applicable[0] || null
}
