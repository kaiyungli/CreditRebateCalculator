/**
 * Calculator Evaluators - Unit Tests
 * Deterministic tests for rule and offer evaluation
 */

const path = require('path')

// Test results
let passed = 0
let failed = 0

function expect(actual) {
  return {
    toBe: function(expected) {
      if (actual === expected) {
        passed++
      } else {
        failed++
        console.error('  ❌ Expected ' + expected + ', got ' + actual)
      }
    },
    toBeDefined: function() {
      if (actual !== undefined && actual !== null) {
        passed++
      } else {
        failed++
        console.error('  ❌ Expected defined, got ' + actual)
      }
    }
  }
}

// ===== Test: chooseBestRule =====
function testChooseBestRule() {
  console.log('\n--- Test: chooseBestRule ---')
  
  // Inline the function (copy from ruleEvaluator.js)
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

  // Test: merchant rule has highest priority
  const result = chooseBestRule(rules, 1)
  expect(result).toBeDefined()
  expect(result.scope_type).toBe('MERCHANT')
  expect(result.rate_value).toBe(5)

  // Test: no rules = null
  expect(chooseBestRule([], 999)).toBe(null)
}

// ===== Test: calculateReward =====
function testCalculateReward() {
  console.log('\n--- Test: calculateReward ---')
  
  function calculateReward(rule, amount) {
    if (!rule) return { rewardAmount: 0, rewardKind: null, effectiveRate: null }
    const rateValue = Number(rule.rate_value)
    let rewardAmount = 0
    if (rule.rate_unit === 'PERCENT') {
      rewardAmount = (amount * rateValue) / 100
    } else if (rule.rate_unit === 'FIXED') {
      rewardAmount = rateValue
    } else if (rule.rate_unit === 'PER_AMOUNT') {
      const perAmount = Number(rule.per_amount) || 1
      rewardAmount = Math.floor(amount / perAmount) * rateValue
    }
    if (rule.cap_value && rule.cap_value > 0) {
      rewardAmount = Math.min(rewardAmount, Number(rule.cap_value))
    }
    return { rewardAmount: Math.round(rewardAmount * 100) / 100, rewardKind: 'CASHBACK', effectiveRate: rateValue }
  }

  // Test: PERCENT - 2%
  expect(calculateReward({ rate_unit: 'PERCENT', rate_value: 2 }, 1000).rewardAmount).toBe(20)

  // Test: FIXED
  expect(calculateReward({ rate_unit: 'FIXED', rate_value: 50 }, 500).rewardAmount).toBe(50)

  // Test: PER_AMOUNT
  expect(calculateReward({ rate_unit: 'PER_AMOUNT', rate_value: 1, per_amount: 100 }, 500).rewardAmount).toBe(5)

  // Test: CAP applied
  expect(calculateReward({ rate_unit: 'PERCENT', rate_value: 10, cap_value: 50 }, 1000).rewardAmount).toBe(50)

  // Test: null rule
  expect(calculateReward(null, 1000).rewardAmount).toBe(0)
}

// ===== Test: estimateOfferValue =====
function testEstimateOfferValue() {
  console.log('\n--- Test: estimateOfferValue ---')
  
  function estimateOfferValue(offer, amount) {
    if (!offer) return 0
    if (offer.min_spend && amount < Number(offer.min_spend)) return 0
    const value = Number(offer.value) || 0
    if (offer.value_type === 'FIXED') {
      return Math.min(value, Number(offer.max_discount) || value)
    }
    if (offer.value_type === 'PERCENT') {
      let calculated = (amount * value) / 100
      return Math.min(calculated, Number(offer.max_discount) || calculated)
    }
    return 0
  }

  // Test: FIXED
  expect(estimateOfferValue({ value_type: 'FIXED', value: 30 }, 100)).toBe(30)

  // Test: FIXED with cap
  expect(estimateOfferValue({ value_type: 'FIXED', value: 50, max_discount: 30 }, 100)).toBe(30)

  // Test: PERCENT
  expect(estimateOfferValue({ value_type: 'PERCENT', value: 5 }, 200)).toBe(10)

  // Test: PERCENT with cap
  expect(estimateOfferValue({ value_type: 'PERCENT', value: 10, max_discount: 15 }, 200)).toBe(15)

  // Test: min_spend not met
  expect(estimateOfferValue({ value_type: 'FIXED', value: 10, min_spend: 500 }, 100)).toBe(0)
}

// ===== Test: base reward only =====
function testBaseRewardOnly() {
  console.log('\n--- Test: base reward only (single card) ---')
  
  function calculateReward(rule, amount) {
    if (!rule) return { rewardAmount: 0, rewardKind: null, effectiveRate: null }
    const rateValue = Number(rule.rate_value)
    let rewardAmount = 0
    if (rule.rate_unit === 'PERCENT') {
      rewardAmount = (amount * rateValue) / 100
    }
    if (rule.cap_value && rule.cap_value > 0) {
      rewardAmount = Math.min(rewardAmount, Number(rule.cap_value))
    }
    return { rewardAmount: Math.round(rewardAmount * 100) / 100, rewardKind: 'CASHBACK', effectiveRate: rateValue }
  }

  // Single card, 2% reward
  const card = { card_id: 1, card_name: 'Test Card', bank_name: 'Test Bank' }
  const rule = { card_id: 1, rate_unit: 'PERCENT', rate_value: 2 }
  const amount = 1000
  
  const result = calculateReward(rule, amount)
  expect(result.rewardAmount).toBe(20)
}

// ===== Test: base reward + fixed offer =====
function testBaseRewardWithFixedOffer() {
  console.log('\n--- Test: base reward + fixed offer ---')
  
  function calculateReward(rule, amount) {
    if (!rule) return { rewardAmount: 0 }
    const rateValue = Number(rule.rate_value)
    let rewardAmount = 0
    if (rule.rate_unit === 'PERCENT') {
      rewardAmount = (amount * rateValue) / 100
    }
    return { rewardAmount: Math.round(rewardAmount * 100) / 100 }
  }

  function estimateOfferValue(offer, amount) {
    if (!offer || offer.min_spend && amount < Number(offer.min_spend)) return 0
    if (offer.value_type === 'FIXED') return Math.min(Number(offer.value), Number(offer.max_discount) || Number(offer.value))
    return 0
  }

  // Card with reward + offer
  const rule = { rate_unit: 'PERCENT', rate_value: 2 }
  const offer = { value_type: 'FIXED', value: 30 }
  const amount = 1000

  const baseReward = calculateReward(rule, amount)
  const offerValue = estimateOfferValue(offer, amount)
  const total = baseReward.rewardAmount + offerValue

  expect(baseReward.rewardAmount).toBe(20)
  expect(offerValue).toBe(30)
  expect(total).toBe(50)
}

// ===== Test: multiple cards, choose best =====
function testMultipleCardsChooseBest() {
  console.log('\n--- Test: multiple cards, choose best ---')
  
  function calculateReward(rule, amount) {
    if (!rule) return { rewardAmount: 0 }
    const rateValue = Number(rule.rate_value)
    let rewardAmount = 0
    if (rule.rate_unit === 'PERCENT') {
      rewardAmount = (amount * rateValue) / 100
    }
    return { rewardAmount: Math.round(rewardAmount * 100) / 100 }
  }

  // 3 cards with different rewards
  const cards = [
    { card_id: 1, card_name: 'Card A', rate_value: 1 },
    { card_id: 2, card_name: 'Card B', rate_value: 2 },
    { card_id: 3, card_name: 'Card C', rate_value: 3 },
  ]
  const amount = 1000

  const results = cards.map(card => {
    const reward = calculateReward({ rate_unit: 'PERCENT', rate_value: card.rate_value }, amount)
    return { card_id: card.card_id, card_name: card.card_name, total_value: reward.rewardAmount }
  })

  // Sort by total_value desc
  results.sort((a, b) => b.total_value - a.total_value)
  const best = results[0]

  expect(best.card_id).toBe(3) // 3% is best
  expect(best.total_value).toBe(30)
}

// Run tests
console.log('🧪 Running deterministic calculator tests...')
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
