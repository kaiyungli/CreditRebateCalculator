/**
 * Card Value Calculator
 * 
 * Calculates best card value combining:
 * - reward_rules (base rewards)
 * - merchant_offers (promotions)
 */

const SUPABASE_URL = 'https://qcvileuzjzoltwttrjli.supabase.co'
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjdmlsZXV6anpvbHR3dHRyamxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NDIyNTksImV4cCI6MjA4NjUxODI1OX0.Lsy0hszyCsB6ZrtREanBQcOioBV6e5JtZG9R4y8m6R4'

/** Fetch reward rules */
async function getRewardRules() {
  const res = await fetch(SUPABASE_URL + '/rest/v1/reward_rules?select=*&is_active.eq.true', {
    headers: { 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + ANON_KEY }
  })
  return res.json()
}

/** Fetch merchant offers */
async function getMerchantOffers(merchantId, categoryId) {
  const filters = []
  if (merchantId) filters.push('merchant_id.eq.' + merchantId)
  if (categoryId) filters.push('category_id.eq.' + categoryId)
  
  const res = await fetch(SUPABASE_URL + '/rest/v1/merchant_offers?select=*&is_active.eq.true' + (filters.length ? '&' + filters.join('&') : ''), {
    headers: { 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + ANON_KEY }
  })
  return res.json()
}

/** Calculate base reward from rule */
function calculateBaseReward(amount, rule) {
  if (!rule) return 0
  
  const value = parseFloat(rule.value || 0)
  const valueType = rule.value_type
  const minSpend = parseFloat(rule.min_spend || 0)
  
  // Check min_spend
  if (minSpend && amount < minSpend) return 0
  
  if (valueType === 'PERCENT') {
    return Math.floor(amount * value / 100)
  } else if (valueType === 'PER_AMOUNT') {
    // e.g., spend $4 = 1 mile
    const perValue = parseFloat(rule.per_value || 1)
    return Math.floor(amount / perValue) * value
  } else if (valueType === 'FIXED') {
    return value
  }
  
  return 0
}

/** Calculate offer reward from merchant offer */
function calculateOfferReward(amount, offer) {
  if (!offer) return 0
  
  const value = parseFloat(offer.value || 0)
  const valueType = offer.value_type
  const minSpend = parseFloat(offer.min_spend || 0)
  
  if (minSpend && amount < minSpend) return 0
  
  // Handle coupon as full value
  if (offer.offer_type === 'COUPON' || offer.offer_type === 'FIXED') {
    return value
  }
  
  if (valueType === 'PERCENT') {
    return Math.floor(amount * value / 100)
  }
  
  return value
}

/** Calculate best card for a transaction */
async function calculateBestCard(input) {
  const { amount, merchant_id, category_id } = input
  
  if (!amount || amount <= 0) {
    throw new Error('Invalid amount')
  }
  
  // 1. Get eligible rules and offers
  const rules = await getRewardRules()
  const offers = await getMerchantOffers(merchant_id, category_id)
  
  const results = []
  
  // 2. Process each card via reward rules
  for (const rule of rules) {
    const cardId = rule.card_id
    if (!cardId) continue
    
    // Base reward
    const baseReward = calculateBaseReward(amount, rule)
    
    // Find offer for this card
    const cardOffers = offers.filter(o => 
      (o.card_id === cardId || (!o.card_id && (!o.merchant_id || o.merchant_id === merchant_id)))
    )
    
    // Apply highest applicable offer
    let offerReward = 0
    let appliedOffer = null
    for (const offer of cardOffers) {
      const reward = calculateOfferReward(amount, offer)
      if (reward > offerReward) {
        offerReward = reward
        appliedOffer = offer
      }
    }
    
    const totalValue = baseReward + offerReward
    
    results.push({
      card_id: cardId,
      total_value: totalValue,
      base_reward: baseReward,
      offer_reward: offerReward,
      offer: appliedOffer ? {
        description: appliedOffer.title,
        value: appliedOffer.value,
        value_type: appliedOffer.value_type
      } : null
    })
  }
  
  // 3. Rank by total_value
  results.sort((a, b) => b.total_value - a.total_value)
  
  // 4. Build response
  return {
    best_card_id: results[0]?.card_id || null,
    results: results.slice(0, 10).map(r => ({
      card_id: r.card_id,
      total_value: r.total_value,
      breakdown: {
        base_reward: r.base_reward,
        offer_reward: r.offer_reward
      },
      details: [
        ...(r.base_reward > 0 ? [{ type: 'reward_rule', value: r.base_reward }] : []),
        ...(r.offer_reward > 0 ? [{ type: 'merchant_offer', value: r.offer_reward }] : [])
      ]
    }))
  }
}

export default { calculateBestCard }
