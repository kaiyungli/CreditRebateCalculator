import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = (supabaseUrl && supabaseKey && !supabaseUrl.includes('Your_')) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null

// Demo offers data
const DEMO_OFFERS = [
  {
    id: 1,
    merchant_id: 1,
    merchant_name_snapshot: '壽司郎',
    card_id: null,
    title: 'HK$50 優惠券',
    description: '消費滿HK$200減HK$50',
    offer_type: 'COUPON',
    value_type: 'FIXED',
    value: 50,
    min_spend: 200,
    max_discount: 50,
    stackable: true,
    is_verified: false,
    code: 'SUSHI50',
    url: null,
    valid_from: '2026-01-01',
    valid_to: '2026-03-31',
    source: 'manual',
    external_id: null,
    status: 'ACTIVE'
  },
  {
    id: 2,
    merchant_id: 1,
    merchant_name_snapshot: '壽司郎',
    card_id: 1,
    title: 'HSBC 卡 額外5%折扣',
    description: 'HSBC信用卡額外5%折扣',
    offer_type: 'EXTRA_CASHBACK',
    value_type: 'PERCENT',
    value: 5,
    min_spend: 100,
    max_discount: 50,
    stackable: true,
    is_verified: false,
    code: null,
    url: null,
    valid_from: '2026-02-01',
    valid_to: '2026-04-30',
    source: 'hongkongcard',
    external_id: 'hkcard_123',
    status: 'ACTIVE'
  },
  {
    id: 3,
    merchant_id: 2,
    merchant_name_snapshot: '麥當勞',
    card_id: null,
    title: '免運優惠',
    description: '訂餐滿HK$60免運費',
    offer_type: 'CASH_DISCOUNT',
    value_type: 'FIXED',
    value: 15,
    min_spend: 60,
    max_discount: 15,
    stackable: false,
    is_verified: true,
    code: null,
    url: 'https://mcdelivery.com.hk',
    valid_from: '2026-03-01',
    valid_to: '2026-03-31',
    source: 'manual',
    external_id: null,
    status: 'ACTIVE'
  }
]

export default supabase

/**
 * Get active offers for a merchant and/or card
 * @param {Object} params - Filter parameters
 * @param {number} params.merchantId - Merchant ID
 * @param {number} params.cardId - Card ID (optional)
 * @param {string} params.date - Date to check validity (YYYY-MM-DD)
 * @param {number} params.amount - Spend amount for min_spend calculation
 */
export async function getActiveOffers({ merchantId, cardId, date, amount } = {}) {
  // Use demo data if no Supabase
  if (!supabase) {
    let offers = DEMO_OFFERS.filter(o => o.status === 'ACTIVE')
    
    // Filter by date
    const checkDate = date || new Date().toISOString().split('T')[0]
    offers = offers.filter(o => checkDate >= o.valid_from && checkDate <= o.valid_to)
    
    // Filter by merchant
    if (merchantId) {
      offers = offers.filter(o => o.merchant_id === merchantId)
    }
    
    // Filter by card (NULL = all cards, or exact match)
    if (cardId) {
      offers = offers.filter(o => o.card_id === null || o.card_id === cardId)
    }
    
    // Filter by amount
    if (amount) {
      offers = offers.filter(o => !o.min_spend || amount >= o.min_spend)
    }
    
    return offers
  }

  const checkDate = date || new Date().toISOString().split('T')[0]
  
  let query = supabase
    .from('merchant_offers')
    .select('*')
    .eq('status', 'ACTIVE')
    .lte('valid_from', checkDate)
    .gte('valid_to', checkDate)

  if (merchantId) {
    query = query.eq('merchant_id', merchantId)
  }

  if (cardId) {
    // Card-specific offer OR offer available for all cards (card_id = null)
    query = query.or(`card_id.eq.${cardId},card_id.is.null`)
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
    return DEMO_OFFERS.filter(o => o.status === 'ACTIVE').slice(0, limit)
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

  if (offer.value_type === 'PERCENT') {
    value = spendAmount * (offer.value / 100)
  } else if (offer.value_type === 'FIXED') {
    value = offer.value
  } else if (offer.value_type === 'PER_SPEND') {
    // e.g., $5 per $100 spent
    value = Math.floor(spendAmount / offer.value) * offer.value
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
