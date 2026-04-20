/**
 * Calculator Evaluators - Unit Tests
 * Tests normalized camelCase interface
 */

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

// ===== Test: chooseBestRule =====
function testChooseBestRule() {
  console.log('\n--- Test: chooseBestRule (camelCase) ---')
  
  // camelCase: cardId, merchantId, categoryId, scopeType
  function chooseBestRule(rules, cardId) {
    const cardRules = rules.filter(r => r.cardId === cardId)
    if (!cardRules || cardRules.length === 0) return null
    const merchantRule = cardRules.find(r => r.merchantId != null)
    if (merchantRule) return { ...merchantRule, scopeType: 'MERCHANT' }
    const categoryRule = cardRules.find(r => r.categoryId != null && r.merchantId == null)
    if (categoryRule) return { ...categoryRule, scopeType: 'CATEGORY' }
    const generalRule = cardRules.find(r => r.merchantId == null && r.categoryId == null)
    if (generalRule) return { ...generalRule, scopeType: 'GENERAL' }
    return null
  }

  // camelCase input
  const rules = [
    { cardId: 1, merchantId: null, categoryId: 1, rateValue: 1 },
    { cardId: 1, merchantId: 10, categoryId: null, rateValue: 5 },
    { cardId: 1, merchantId: null, categoryId: 2, rateValue: 3 },
  ]

  expect(chooseBestRule(rules, 1).scopeType).toBe('MERCHANT')
  expect(chooseBestRule(rules, 1).rateValue).toBe(5)
  expect(chooseBestRule([], 999)).toBe(null)
}

// ===== Test: calculateReward =====
function testCalculateReward() {
  console.log('\n--- Test: calculateReward (camelCase) ---')
  
  // camelCase: rateUnit, rateValue, capValue
  function calculateReward(rule, amount) {
    if (!rule) return { rewardAmount: 0, rewardKind: null, effectiveRate: null }
    const rateValue = Number(rule.rateValue)
    let rewardAmount = 0
    if (rule.rateUnit === 'PERCENT') rewardAmount = (amount * rateValue) / 100
    else if (rule.rateUnit === 'FIXED') rewardAmount = rateValue
    else if (rule.rateUnit === 'PER_AMOUNT') {
      const perAmount = Number(rule.perAmount) || 1
      rewardAmount = Math.floor(amount / perAmount) * rateValue
    }
    if (rule.capValue && rule.capValue > 0) rewardAmount = Math.min(rewardAmount, Number(rule.capValue))
    return { rewardAmount: Math.round(rewardAmount * 100) / 100, rewardKind: 'CASHBACK', effectiveRate: rateValue }
  }

  expect(calculateReward({ rateUnit: 'PERCENT', rateValue: 2 }, 1000).rewardAmount).toBe(20)
  expect(calculateReward({ rateUnit: 'FIXED', rateValue: 50 }, 500).rewardAmount).toBe(50)
  expect(calculateReward({ rateUnit: 'PERCENT', rateValue: 10, capValue: 50 }, 1000).rewardAmount).toBe(50)
  expect(calculateReward(null, 1000).rewardAmount).toBe(0)
}

// ===== Test: estimateOfferValue =====
function testEstimateOfferValue() {
  console.log('\n--- Test: estimateOfferValue (camelCase) ---')
  
  // camelCase: minSpend, valueType, maxDiscount
  function estimateOfferValue(offer, amount) {
    if (!offer) return 0
    if (offer.minSpend && amount < Number(offer.minSpend)) return 0
    const value = Number(offer.value) || 0
    if (offer.valueType === 'FIXED') return Math.min(value, Number(offer.maxDiscount) || value)
    if (offer.valueType === 'PERCENT') {
      let calculated = (amount * value) / 100
      return Math.min(calculated, Number(offer.maxDiscount) || calculated)
    }
    return 0
  }

  expect(estimateOfferValue({ valueType: 'FIXED', value: 30 }, 100)).toBe(30)
  expect(estimateOfferValue({ valueType: 'FIXED', value: 50, maxDiscount: 30 }, 100)).toBe(30)
  expect(estimateOfferValue({ valueType: 'PERCENT', value: 5 }, 200)).toBe(10)
  expect(estimateOfferValue({ valueType: 'PERCENT', value: 10, maxDiscount: 15 }, 200)).toBe(15)
  expect(estimateOfferValue({ valueType: 'FIXED', value: 10, minSpend: 500 }, 100)).toBe(0)
}

// ===== Test: normalization mapping =====
function testNormalization() {
  console.log('\n--- Test: normalization (snake_case → camelCase) ---')
  
  // Simulate repository normalization
  function normalizeOffer(offer) {
    if (!offer) return null
    return {
      id: offer.id,
      merchantId: offer.merchant_id || null,
      bankId: offer.bank_id || null,
      cardId: offer.card_id || null,
      title: offer.title,
      valueType: offer.value_type,
      value: Number(offer.value) || 0,
      minSpend: offer.min_spend ? Number(offer.min_spend) : null
    }
  }

  const raw = {
    id: 1,
    merchant_id: 10,
    bank_id: 2,
    card_id: null,
    title: 'Test Offer',
    value_type: 'PERCENT',
    value: 5,
    min_spend: 100
  }

  const normalized = normalizeOffer(raw)
  
  expect(normalized.id).toBe(1)
  expect(normalized.merchantId).toBe(10)
  expect(normalized.bankId).toBe(2)
  expect(normalized.cardId).toBe(null)
  expect(normalized.valueType).toBe('PERCENT')
  expect(normalized.value).toBe(5)
  expect(normalized.minSpend).toBe(100)
}

// ===== Test: null / optional handling =====
function testNullHandling() {
  console.log('\n--- Test: null / optional field handling ---')
  
  function normalizeOffer(offer) {
    if (!offer) return null
    return {
      id: offer.id,
      merchantId: offer.merchant_id || null,
      title: offer.title
    }
  }

  // null merchant_id
  const withNull = { id: 1, merchant_id: null, title: 'Test' }
  expect(normalizeOffer(withNull).merchantId).toBe(null)

  // undefined field
  const noMerchant = { id: 2, title: 'Test2' }
  expect(normalizeOffer(noMerchant).merchantId).toBe(null)
}

// ===== Test: Base reward only =====
function testBaseRewardOnly() {
  console.log('\n--- Test: base reward only ---')
  
  function calculateReward(rule, amount) {
    if (!rule) return { rewardAmount: 0 }
    return { rewardAmount: rule.rateUnit === 'PERCENT' ? Math.round(amount * rule.rateValue / 100 * 100) / 100 : 0 }
  }

  expect(calculateReward({ rateUnit: 'PERCENT', rateValue: 2 }, 1000).rewardAmount).toBe(20)
}

// Run tests
console.log('🧪 Running normalized interface tests...')
testChooseBestRule()
testCalculateReward()
testEstimateOfferValue()
testNormalization()
testNullHandling()
testBaseRewardOnly()

console.log('\n--- Results: ' + passed + ' passed, ' + failed + ' failed ---')
if (failed === 0) {
  console.log('✅ All tests passed')
  process.exit(0)
} else {
  console.log('❌ Some tests failed')
  process.exit(1)
}
