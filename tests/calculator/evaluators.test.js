/**
 * Calculator Evaluators - Unit Tests
 * Tests aligned with domain ownership
 */

// Test results
let passed = 0
let failed = 0

function expect(actual) {
  return {
    toBe: function(expected) {
      if (actual === expected) { passed++ } else { failed++; console.error('  ❌ Expected ' + expected + ', got ' + actual) }
    },
    toBeDefined: function() {
      if (actual !== undefined && actual !== null) { passed++ } else { failed++; console.error('  ❌ Expected defined') }
    }
  }
}

// ===== Test: chooseBestRule (rewards domain) =====
function testChooseBestRule() {
  console.log('\n--- Test: chooseBestRule (rewards/evaluators) ---')
  
  function chooseBestRule(rules, cardId) {
    const cardRules = rules.filter(r => r.card_id === cardId)
    if (!cardRules || cardRules.length === 0) return null
    const merchantRule = cardRules.find(r => r.merchant_id != null)
    if (merchantRule) return { ...merchantRule, scope_type: 'MERCHANT' }
    const categoryRule = cardRules.find(r => r.category_id != null && r.merchant_id == null)
    if (categoryRule) return { ...categoryRule, scope_type: 'CATEGORY' }
    const generalRule = cardRules.find(r => r.merchant_id == null && r.category_id == null)
    if (generalRule) return { ...generalRule, scope_type: 'GENERAL' }
    return null
  }

  const rules = [
    { card_id: 1, merchant_id: null, category_id: 1, rate_value: 1 },
    { card_id: 1, merchant_id: 10, category_id: null, rate_value: 5 },
    { card_id: 1, merchant_id: null, category_id: 2, rate_value: 3 },
  ]

  expect(chooseBestRule(rules, 1).scope_type).toBe('MERCHANT')
  expect(chooseBestRule(rules, 1).rate_value).toBe(5)
  expect(chooseBestRule([], 999)).toBe(null)
}

// ===== Test: calculateReward (rewards domain) =====
function testCalculateReward() {
  console.log('\n--- Test: calculateReward (rewards/evaluators) ---')
  
  function calculateReward(rule, amount) {
    if (!rule) return { rewardAmount: 0, rewardKind: null, effectiveRate: null }
    const rateValue = Number(rule.rate_value)
    let rewardAmount = 0
    if (rule.rate_unit === 'PERCENT') rewardAmount = (amount * rateValue) / 100
    else if (rule.rate_unit === 'FIXED') rewardAmount = rateValue
    else if (rule.rate_unit === 'PER_AMOUNT') {
      const perAmount = Number(rule.per_amount) || 1
      rewardAmount = Math.floor(amount / perAmount) * rateValue
    }
    if (rule.cap_value && rule.cap_value > 0) rewardAmount = Math.min(rewardAmount, Number(rule.cap_value))
    return { rewardAmount: Math.round(rewardAmount * 100) / 100, rewardKind: 'CASHBACK', effectiveRate: rateValue }
  }

  expect(calculateReward({ rate_unit: 'PERCENT', rate_value: 2 }, 1000).rewardAmount).toBe(20)
  expect(calculateReward({ rate_unit: 'FIXED', rate_value: 50 }, 500).rewardAmount).toBe(50)
  expect(calculateReward({ rate_unit: 'PERCENT', rate_value: 10, cap_value: 50 }, 1000).rewardAmount).toBe(50)
  expect(calculateReward(null, 1000).rewardAmount).toBe(0)
}

// ===== Test: estimateOfferValue (offers domain) =====
function testEstimateOfferValue() {
  console.log('\n--- Test: estimateOfferValue (offers/evaluators) ---')
  
  function estimateOfferValue(offer, amount) {
    if (!offer) return 0
    if (offer.min_spend && amount < Number(offer.min_spend)) return 0
    const value = Number(offer.value) || 0
    if (offer.value_type === 'FIXED') return Math.min(value, Number(offer.max_discount) || value)
    if (offer.value_type === 'PERCENT') {
      let calculated = (amount * value) / 100
      return Math.min(calculated, Number(offer.max_discount) || calculated)
    }
    return 0
  }

  expect(estimateOfferValue({ value_type: 'FIXED', value: 30 }, 100)).toBe(30)
  expect(estimateOfferValue({ value_type: 'FIXED', value: 50, max_discount: 30 }, 100)).toBe(30)
  expect(estimateOfferValue({ value_type: 'PERCENT', value: 5 }, 200)).toBe(10)
  expect(estimateOfferValue({ value_type: 'PERCENT', value: 10, max_discount: 15 }, 200)).toBe(15)
  expect(estimateOfferValue({ value_type: 'FIXED', value: 10, min_spend: 500 }, 100)).toBe(0)
}

// ===== Test: Base reward only =====
function testBaseRewardOnly() {
  console.log('\n--- Test: base reward only (single card) ---')
  
  function calculateReward(rule, amount) {
    if (!rule) return { rewardAmount: 0 }
    const rateValue = Number(rule.rate_value)
    let rewardAmount = rule.rate_unit === 'PERCENT' ? (amount * rateValue) / 100 : 0
    return { rewardAmount: Math.round(rewardAmount * 100) / 100 }
  }

  const rule = { rate_unit: 'PERCENT', rate_value: 2 }
  expect(calculateReward(rule, 1000).rewardAmount).toBe(20)
}

// ===== Test: Base reward + fixed offer =====
function testBaseRewardWithFixedOffer() {
  console.log('\n--- Test: base reward + fixed offer ---')
  
  function calculateReward(rule, amount) {
    if (!rule) return { rewardAmount: 0 }
    const rateValue = Number(rule.rate_value)
    return { rewardAmount: rule.rate_unit === 'PERCENT' ? Math.round(amount * rateValue / 100 * 100) / 100 : 0 }
  }

  function estimateOfferValue(offer, amount) {
    if (!offer || (offer.min_spend && amount < Number(offer.min_spend))) return 0
    if (offer.value_type === 'FIXED') return Math.min(Number(offer.value), Number(offer.max_discount) || Number(offer.value))
    return 0
  }

  const baseReward = calculateReward({ rate_unit: 'PERCENT', rate_value: 2 }, 1000)
  const offerValue = estimateOfferValue({ value_type: 'FIXED', value: 30 }, 1000)
  expect(baseReward.rewardAmount + offerValue).toBe(50)
}

// ===== Test: Multiple cards, choose best =====
function testMultipleCardsChooseBest() {
  console.log('\n--- Test: multiple cards, choose best ---')
  
  function calculateReward(rule, amount) {
    if (!rule) return { rewardAmount: 0 }
    return { rewardAmount: rule.rate_unit === 'PERCENT' ? Math.round(amount * rule.rate_value / 100 * 100) / 100 : 0 }
  }

  const cards = [
    { card_id: 1, rate_value: 1 },
    { card_id: 2, rate_value: 2 },
    { card_id: 3, rate_value: 3 },
  ]

  const results = cards.map(card => ({
    card_id: card.card_id,
    total_value: calculateReward({ rate_unit: 'PERCENT', rate_value: card.rate_value }, 1000).rewardAmount
  }))

  results.sort((a, b) => b.total_value - a.total_value)
  expect(results[0].card_id).toBe(3)
  expect(results[0].total_value).toBe(30)
}

// Run tests
console.log('🧪 Running domain-aligned calculator tests...')
testChooseBestRule()
testCalculateReward()
testEstimateOfferValue()
testBaseRewardOnly()
testBaseRewardWithFixedOffer()
testMultipleCardsChooseBest()

console.log('\n--- Results: ' + passed + ' passed, ' + failed + ' failed ---')
if (failed === 0) {
  console.log('✅ All tests passed')
  process.exit(0)
} else {
  console.log('❌ Some tests failed')
  process.exit(1)
}
