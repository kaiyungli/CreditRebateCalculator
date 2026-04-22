/**
 * Card Value Calculator v3 - Fixed Scope Matching
 * 
 * Fixed: exact ID matching, CARD_WIDE, BANK_WIDE
 */

const SUPABASE_URL = 'https://qcvileuzjzoltwttrjli.supabase.co'
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjdmlsZXV6anpvbHR3dHRyamxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NDIyNTksImV4cCI6MjA4NjUxODI1OX0.Lsy0hszyCsB6ZrtREanBQcOioBV6e5JtZG9R4y8m6R4'

/** Filter by calculation_mode */
function filterRules(rules) {
  return rules.filter(r => r.calculation_mode === 'FULL' || !r.calculation_mode)
}

function filterOffers(offers) {
  return offers.filter(o => o.calculation_mode === 'FULL' || !o.calculation_mode)
}

/** FIXED: Exact scope matching - offer IDs vs request/evaluating card */
function matchesScope(offer, request, cardContext = {}) {
  const scope = offer.scope_type
  if (!scope || scope === 'GENERAL') return true
  
  // Get IDs from offer row
  const offMerchantId = offer.merchant_id
  const offCategoryId = offer.category_id
  const offCardId = offer.card_id
  const offBankId = offer.bank_id
  
  // MERCHANT: require exact match
  if (scope === 'MERCHANT') {
    return offMerchantId && (offMerchantId === request.merchant_id)
  }
  
  // CATEGORY: require exact match  
  if (scope === 'CATEGORY') {
    return offCategoryId && (offCategoryId === request.category_id)
  }
  
  // MERCHANT_CATEGORY: require BOTH to match
  if (scope === 'MERCHANT_CATEGORY') {
    return (offMerchantId === request.merchant_id) && 
           (offCategoryId === request.category_id)
  }
  
  // CARD_WIDE: require exact card ID match
  if (scope === 'CARD_WIDE') {
    return offCardId && (offCardId === cardContext.card_id)
  }
  
  // BANK_WIDE: require exact bank ID match  
  if (scope === 'BANK_WIDE') {
    return offBankId && (offBankId === cardContext.bank_id)
  }
  
  // Default: no match for unknown scope
  return false
}

/** Apply scope filter with card context */
function applyScopeFilter(offers, request, cardContext) {
  return offers.filter(o => matchesScope(o, request, cardContext))
}

function calculateReward(amount, item) {
  if (!item) return 0
  const value = parseFloat(item.value || 0)
  const valueType = item.value_type
  const minSpend = parseFloat(item.min_spend || 0)
  if (minSpend && amount < minSpend) return 0
  if (valueType === 'PERCENT' || valueType === 'PERCENT_DISCOUNT') return Math.floor(amount * value / 100)
  if (valueType === 'PER_AMOUNT') return Math.floor(amount / (parseFloat(item.per_value || 1))) * value
  return value
}

async function getRewardRules() {
  const res = await fetch(SUPABASE_URL + '/rest/v1/reward_rules?select=*&is_active.eq.true', {
    headers: { 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + ANON_KEY }
  })
  return res.json()
}

async function getMerchantOffers(merchantId, categoryId) {
  const filters = ['is_active.eq.true']
  if (merchantId) filters.push('merchant_id.eq.' + merchantId)
  if (categoryId) filters.push('category_id.eq.' + categoryId)
  const res = await fetch(SUPABASE_URL + '/rest/v1/merchant_offers?select=*&' + filters.join('&'), {
    headers: { 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + ANON_KEY }
  })
  return res.json()
}

async function calculateBestCard(input) {
  const { amount, merchant_id, category_id } = input
  if (!amount || amount <= 0) throw new Error('Invalid amount')
  
  let rules = await getRewardRules()
  let offers = await getMerchantOffers(merchant_id, category_id)
  
  rules = filterRules(rules)
  offers = filterOffers(offers)
  
  const results = []
  
  for (const rule of rules) {
    const cardId = rule.card_id
    if (!cardId) continue
    
    // Get card details for scope comparison
    const cardContext = { card_id: cardId, bank_id: rule.bank_id }
    
    // Best rule for this card
    const applicableRules = rules.filter(r => r.card_id === cardId && (!r.min_spend || amount >= r.min_spend))
    applicableRules.sort((a, b) => (b.priority || 0) - (a.priority || 0))
    const bestRule = applicableRules[0]
    const baseReward = calculateReward(amount, bestRule)
    
    // Best offer with exact scope matching
    const cardOffers = applyScopeFilter(offers, input, cardContext)
    cardOffers.sort((a, b) => parseFloat(b.value || 0) - parseFloat(a.value || 0))
    const bestOffer = cardOffers[0]
    const offerReward = calculateReward(amount, bestOffer)
    
    results.push({
      card_id: cardId,
      total_value: baseReward + offerReward,
      base_reward: baseReward,
      offer_reward: offerReward
    })
  }
  
  results.sort((a, b) => b.total_value - a.total_value)
  
  return {
    best_card_id: results[0]?.card_id || null,
    results: results.slice(0, 10)
  }
}

export default { calculateBestCard }
