import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = (supabaseUrl && supabaseKey && !supabaseUrl.includes('Your_')) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null

/**
 * Get active offers with filters
 * @param {Object} params - Filter parameters
 * @param {string} params.merchantName - Merchant name to filter
 * @param {number} params.cardId - Card ID (optional)
 * @param {number} params.categoryId - Category ID (optional)
 * @param {string} params.date - Date to check validity (YYYY-MM-DD)
 * @param {number} params.amount - Spend amount for min_spend calculation
 * @param {boolean} params.isVerified - Only verified offers
 */
export async function getActiveOffers({ 
  merchantName, 
  cardId, 
  categoryId,
  date, 
  amount,
  isVerified = false 
} = {}) {
  // Use demo data if no Supabase
  if (!supabase) {
    return getDemoOffers({ merchantName, cardId, categoryId, date, amount, isVerified })
  }

  const checkDate = date || new Date().toISOString().split('T')[0]
  
  let query = supabase
    .from('merchant_offers')
    .select('*')
    .eq('status', 'ACTIVE')
    .lte('valid_from', checkDate)
    .gte('valid_to', checkDate)

  if (merchantName) {
    query = query.ilike('merchant_name', `%${merchantName}%`)
  }

  if (cardId) {
    // Card-specific offer OR offer available for all cards (card_id = null)
    query = query.or(`card_id.eq.${cardId},card_id.is.null`)
  }

  if (categoryId) {
    query = query.or(`category_id.eq.${categoryId},category_id.is.null`)
  }

  if (isVerified) {
    query = query.eq('is_verified', true)
  }

  const { data, error } = await query
  
  if (error) throw error

  let offers = data || []
  
  // Filter by amount
  if (amount) {
    offers = offers.filter(o => !o.min_spend || amount >= o.min_spend)
  }

  return offers
}

/**
 * Get all active offers (for listing page)
 */
export async function getAllActiveOffers(limit = 50) {
  if (!supabase) {
    return getDemoOffers().slice(0, limit)
  }

  const { data, error } = await supabase
    .from('merchant_offers')
    .select('*')
    .eq('status', 'ACTIVE')
    .lte('valid_from', new Date().toISOString().split('T')[0])
    .gte('valid_to', new Date().toISOString().split('T')[0])
    .limit(limit)

  if (error) throw error
  return data || []
}

/**
 * Calculate offer value for a given amount
 */
export function calculateOfferValue(offer, spendAmount) {
  if (!offer || !spendAmount) return 0
  
  // Check minimum spend
  if (offer.min_spend && spendAmount < offer.min_spend) {
    return 0
  }

  let value = 0

  if (offer.value_type === 'PERCENT' || offer.value_type === 'PERCENTAGE') {
    value = spendAmount * (offer.value / 100)
  } else if (offer.value_type === 'FIXED') {
    value = offer.value
  } else if (offer.value_type === 'PER_SPEND') {
    // e.g., $5 per $100 spent
    value = Math.floor(spendAmount / (offer.min_spend || 100)) * offer.value
  }

  // Apply max discount cap
  if (offer.max_discount && value > offer.max_discount) {
    value = offer.max_discount
  }

  return Math.round(value * 100) / 100
}

/**
 * Get applicable offers and their values for a transaction
 */
export function getApplicableOffers(offers, spendAmount) {
  if (!offers || offers.length === 0) return []

  return offers
    .filter(o => !o.min_spend || spendAmount >= o.min_spend)
    .map(o => ({
      ...o,
      calculatedValue: calculateOfferValue(o, spendAmount)
    }))
    .filter(o => o.calculatedValue > 0)
    .sort((a, b) => b.calculatedValue - a.calculatedValue)
}

/**
 * Get the best stackable offer
 */
export function getBestStackableOffer(offers, spendAmount) {
  const applicable = getApplicableOffers(offers, spendAmount)
  
  // First try to find stackable offers
  const stackable = applicable.find(o => o.stackable)
  if (stackable) return stackable

  // Otherwise return the best single offer
  return applicable[0] || null
}

// Demo offers for fallback
const DEMO_OFFERS = [
  {
    id: 1,
    merchant_id: 1,
    merchant_name: '壽司郎',
    merchant_name_snapshot: '壽司郎',
    card_id: null,
    title: 'HK$50 優惠券',
    offer_type: 'COUPON',
    value_type: 'FIXED',
    value: 50,
    min_spend: 200,
    max_discount: 50,
    stackable: true,
    is_verified: false,
    code: 'SUSHI50',
    valid_from: '2026-01-01',
    valid_to: '2026-12-31',
    source: 'manual',
    status: 'ACTIVE'
  },
  {
    id: 2,
    merchant_id: 1,
    merchant_name: '壽司郎',
    merchant_name_snapshot: '壽司郎',
    card_id: 1,
    title: 'HSBC 卡 額外5%折扣',
    offer_type: 'EXTRA_CASHBACK',
    value_type: 'PERCENT',
    value: 5,
    min_spend: 100,
    max_discount: 50,
    stackable: true,
    is_verified: false,
    valid_from: '2026-02-01',
    valid_to: '2026-04-30',
    source: 'hongkongcard',
    status: 'ACTIVE'
  },
  {
    id: 3,
    merchant_id: 2,
    merchant_name: '麥當勞',
    merchant_name_snapshot: '麥當勞',
    card_id: null,
    title: '免運優惠',
    offer_type: 'CASH_DISCOUNT',
    value_type: 'FIXED',
    value: 15,
    min_spend: 60,
    max_discount: 15,
    stackable: false,
    is_verified: true,
    valid_from: '2026-03-01',
    valid_to: '2026-03-31',
    source: 'manual',
    status: 'ACTIVE'
  }
]

function getDemoOffers({ merchantName, cardId, categoryId, date, amount, isVerified } = {}) {
  let offers = DEMO_OFFERS.filter(o => o.status === 'ACTIVE')
  
  // Filter by date
  const checkDate = date || new Date().toISOString().split('T')[0]
  offers = offers.filter(o => checkDate >= o.valid_from && checkDate <= o.valid_to)
  
  // Filter by merchant name
  if (merchantName) {
    offers = offers.filter(o => o.merchant_name?.includes(merchantName))
  }
  
  // Filter by card
  if (cardId) {
    offers = offers.filter(o => o.card_id === null || o.card_id === cardId)
  }
  
  // Filter by verified
  if (isVerified) {
    offers = offers.filter(o => o.is_verified)
  }
  
  // Filter by amount
  if (amount) {
    offers = offers.filter(o => !o.min_spend || amount >= o.min_spend)
  }
  
  return offers
}

export default supabase
