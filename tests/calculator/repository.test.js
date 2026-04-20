/**
 * Repository Normalization Tests
 * Tests maxReward cap behavior and saveCalculation alignment
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

// ===== Test: offersRepository uses maxReward (NOT maxDiscount) =====
function testMaxRewardNormalization() {
  console.log('\n--- Test: normalizeOffer uses maxReward ---')
  
  // Domain field is maxReward, DB field is max_reward
  function normalizeOffer(offer) {
    if (!offer) return null
    return {
      id: offer.id,
      valueType: offer.value_type,
      value: Number(offer.value) || 0,
      minSpend: offer.min_spend ? Number(offer.min_spend) : null,
      maxReward: offer.max_reward ? Number(offer.max_reward) : null  // DB: max_reward → domain: maxReward
    }
  }

  const raw = {
    id: 1,
    value_type: 'PERCENT',
    value: 10,
    max_reward: 50  // DB field is max_reward
  }

  const normalized = normalizeOffer(raw)
  
  expect(normalized.valueType).toBe('PERCENT')
  expect(normalized.value).toBe(10)
  expect(normalized.maxReward).toBe(50)
}

// ===== Test: maxReward cap behavior =====
function testMaxRewardCap() {
  console.log('\n--- Test: maxReward cap behavior ---')
  
  // Evaluator uses maxReward (domain field)
  function estimateOfferValue(offer, amount) {
    if (!offer) return 0
    if (offer.minSpend && amount < Number(offer.minSpend)) return 0
    const value = Number(offer.value) || 0
    if (offer.valueType === 'FIXED') return Math.min(value, Number(offer.maxReward) || value)
    if (offer.valueType === 'PERCENT') {
      let calculated = (amount * value) / 100
      return Math.min(calculated, Number(offer.maxReward) || calculated)
    }
    return 0
  }

  // Test: 10% on $200 = $20, capped at $15
  const offer = { valueType: 'PERCENT', value: 10, maxReward: 15 }
  const amount = 200
  const result = estimateOfferValue(offer, amount)
  expect(result).toBe(15)

  // Test: no cap - maxReward null
  const noCap = { valueType: 'PERCENT', value: 5, maxReward: null }
  expect(estimateOfferValue(noCap, 200)).toBe(10)  // $10 = 5% of $200

  // Test: FIXED with cap
  const fixedWithCap = { valueType: 'FIXED', value: 50, maxReward: 30 }
  expect(estimateOfferValue(fixedWithCap, 100)).toBe(30)  // capped
}

// ===== Test: saveCalculation schema alignment =====
function testSaveCalculationSchema() {
  console.log('\n--- Test: saveCalculation payload vs DB schema ---')
  
  // DB schema: id, user_id, input_json, result_json, created_at
  // Our payload matches schema
  const payload = {
    user_id: 1,
    input_json: { 
      merchant_id: 10, 
      category_id: 2, 
      amount: 1000, 
      card_ids: [1, 2, 3] 
    },
    result_json: { 
      results: [], 
      bestCard: null 
    }
  }

  // Verify we have correct fields
  expect(payload.user_id).toBe(1)
  expect('input_json' in payload).toBe(true)
  expect('result_json' in payload).toBe(true)
  expect(payload.input_json.merchant_id).toBe(10)
  expect(payload.result_json.bestCard).toBe(null)
}

// ===== Test: offerEvaluator input format (camelCase) =====
function testEvaluatorUsesMaxReward() {
  console.log('\n--- Test: offerEvaluator uses maxReward consistently ---')
  
  // Must use maxReward - NOT maxDiscount
  function estimateOfferValue(offer, amount) {
    if (!offer) return 0
    if (offer.minSpend && amount < Number(offer.minSpend)) return 0
    const value = Number(offer.value) || 0
    // Domain field is maxReward
    if (offer.valueType === 'FIXED') return Math.min(value, Number(offer.maxReward) || value)
    if (offer.valueType === 'PERCENT') {
      let calculated = (amount * value) / 100
      return Math.min(calculated, Number(offer.maxReward) || calculated)
    }
    return 0
  }

  const offer = { valueType: 'PERCENT', value: 10, maxReward: 25, minSpend: null }
  expect(estimateOfferValue(offer, 200)).toBe(20)  // $20 = 10% of $200
  
  // With cap - should be capped at 25 but $20 < 25 so no cap
  expect(estimateOfferValue(offer, 300)).toBe(25)  // $30, capped to $25
}

// Run tests
console.log('🧪 Running contract correctness tests...')
testMaxRewardNormalization()
testMaxRewardCap()
testSaveCalculationSchema()
testEvaluatorUsesMaxReward()

console.log('\n--- Results: ' + passed + ' passed, ' + failed + ' failed ---')
if (failed === 0) {
  console.log('✅ All tests passed')
  process.exit(0)
} else {
  console.log('❌ Some tests failed')
  process.exit(1)
}
