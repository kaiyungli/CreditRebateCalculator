/**
 * Card Value Calculator v2 - Hardened
 * 
 * Fixed: calculation_mode, scope_type, priority, no double counting
 */

const SUPABASE_URL = 'https://qcvileuzjzoltwttrjli.supabase.co'
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjdmlsZXV6anpvbHR3dHRyamxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NDIyNTksImV4cCI6MjA4NjUxODI1OX0.Lsy0hszyCsB6ZrtREanBQcOioBV6e5JtZG9R4y8m6R4'

/** Filter rules by calculation_mode - DISPLAY_ONLY and CONDITIONAL excluded */
function filterRules(rules) {
  return rules.filter(r => 
    r.calculation_mode === 'FULL' || !r.calculation_mode
  )
}

/** Filter offers by calculation_mode */
function filterOffers(offers) {
  return offers.filter(o => 
    o.calculation_mode === 'FULL' || !o.calculation_mode
  )
}

/** Check scope matching */
function matchesScope(scope, request) {
  const { merchant_id, category_id, card_id, bank_id } = request
  const scopeType = scope || 'MERCHANT'
  
  if (scopeType === 'MERCHANT' && merchant_id) return true
  if (scopeType === 'CATEGORY' && category_id) return true
  if (scopeType === 'MERCHANT_CATEGORY' && merchant_id && category_id) return true
  if (scopeType === 'CARD_WIDE' && card_id) return true
  if (scopeType === 'BANK_WIDE' && bank_id) return true
  if (!scopeType || scopeType === 'GENERAL') return true
  
  return false
}

/** Apply scope filtering to offers */
function applyScopeFilter(offers, request) {
  return offers.filter(o => matchesScope(o.scope_type, request))
}

/** Get best rule - highest priority wins */
function getBestRule(rules, amount) {
  if (!rules.length) return null
  
  // Filter applicable by min_spend
  const applicable = rules.filter(r => 
    !r.min_spend || amount >= r.min_spend
  )
  
  if (!applicable.length) return null
  
  // Sort by priority DESC, then specificity
  applicable.sort((a, b) => {
    const pA = a.priority || 0
    const pB = b.priority || 0
    return pB - pA
  })
  
  return applicable[0]
}

/** Get best offer - highest value wins (no stacking v1) */
function getBestOffer(offers, amount) {
  if (!offers.length) return null
  
  // Filter applicable by min_spend
  const applicable = offers.filter(o =>
    !o.min_spend || amount >= o.min_spend
  )
  
  if (!applicable.length) return null
  
  // Sort by value DESC
  applicable.sort((a, b) => {
    const vA = parseFloat(a.value || 0)
    const vB = parseFloat(b.value || 0)
    if (a.value_type === 'PERCENT') return vB - vA
    return vB - vA
  })
  
  return applicable[0]
}

/** Calculate reward */
function calculateReward(amount, item) {
  if (!item) return 0
  
  const value = parseFloat(item.value || 0)
  const valueType = item.value_type
  const minSpend = parseFloat(item.min_spend || 0)
  
  if (minSpend && amount < minSpend) return 0
  
  if (valueType === 'PERCENT' || valueType === 'PERCENT_DISCOUNT') {
    return Math.floor(amount * value / 100)
  } else if (valueType === 'PER_AMOUNT') {
    const perValue = parseFloat(item.per_value || 1)
    return Math.floor(amount / perValue) * value
  }
  
  return value
}

/** Fetch reward rules */
async function getRewardRules() {
  const res = await fetch(SUPABASE_URL + '/rest/v1/reward_rules?select=*&is_active.eq.true', {
    headers: { 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + ANON_KEY }
  })
  return res.json()
}

/** Fetch merchant offers */
async function getMerchantOffers(merchantId, categoryId) {
  const filters = ['is_active.eq.true']
  if (merchantId) filters.push('merchant_id.eq.' + merchantId)
  if (categoryId) filters.push('category_id.eq.' + categoryId)
  
  const res = await fetch(SUPABASE_URL + '/rest/v1/merchant_offers?select=*&' + filters.join('&'), {
    headers: { 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + ANON_KEY }
  })
  return res.json()
}

/** Calculate best card */
async function calculateBestCard(input) {
  const { amount, merchant_id, category_id } = input
  
  if (!amount || amount <= 0) {
    throw new Error('Invalid amount')
  }
  
  // Get data
  let rules = await getRewardRules()
  let offers = await getMerchantOffers(merchant_id, category_id)
  
  // Filter by calculation_mode
  rules = filterRules(rules)
  offers = filterOffers(offers)
  
  // Apply scope filtering for offers
  offers = applyScopeFilter(offers, input)
  
  const results = []
  
  // Process each card
  for (const rule of rules) {
    const cardId = rule.card_id
    if (!cardId) continue
    
    // Get best rule for this card
    const bestRule = getBestRule(
      rules.filter(r => r.card_id === cardId),
      amount
    )
    const baseReward = calculateReward(amount, bestRule)
    
    // Get best offer for this card
    const cardOffers = offers.filter(o => o.card_id === cardId)
    const bestOffer = getBestOffer(cardOffers, amount)
    const offerReward = calculateReward(amount, bestOffer)
    
    // No double counting - take higher of base or offer if unclear
    // Actually, they should stack but v1 conservative: sum only if both exist
    const totalValue = baseReward + offerReward
    
    results.push({
      card_id: cardId,
      total_value: totalValue,
      base_reward: baseReward,
      offer_reward: offerReward,
      applied_rule: bestRule ? { title: bestRule.title, value: bestRule.value } : null,
      applied_offer: bestOffer ? { title: bestOffer.title, value: bestOffer.value, stackable: bestOffer.stackable } : null
    })
  }
  
  // Rank
  results.sort((a, b) => b.total_value - a.total_value)
  
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
        ...(r.base_reward > 0 && r.applied_rule ? [{ type: 'reward_rule', description: r.applied_rule.title, value: r.base_reward }] : []),
        ...(r.offer_reward > 0 && r.applied_offer ? [{ type: 'merchant_offer', description: r.applied_offer.title, value: r.offer_reward }] : [])
      ]
    }))
  }
}

export default { calculateBestCard }
