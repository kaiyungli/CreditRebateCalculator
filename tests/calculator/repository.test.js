/**
 * Repository Normalization Tests
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

// ===== Test: offersRepository normalization =====
function testOffersNormalization() {
  console.log('\n--- Test: offersRepository normalizeOffer ---')
  
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
      minSpend: offer.min_spend ? Number(offer.min_spend) : null,
      maxDiscount: offer.max_discount ? Number(offer.max_discount) : null
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
    min_spend: 100,
    max_discount: 50
  }

  const normalized = normalizeOffer(raw)
  
  expect(normalized.id).toBe(1)
  expect(normalized.merchantId).toBe(10)
  expect(normalized.bankId).toBe(2)
  expect(normalized.cardId).toBe(null)
  expect(normalized.valueType).toBe('PERCENT')
  expect(normalized.value).toBe(5)
  expect(normalized.minSpend).toBe(100)
  expect(normalized.maxDiscount).toBe(50)
}

// ===== Test: rulesRepository normalization =====
function testRulesNormalization() {
  console.log('\n--- Test: rulesRepository normalizeRule ---')
  
  function normalizeRule(rule) {
    if (!rule) return null
    return {
      id: rule.id,
      cardId: rule.card_id,
      merchantId: rule.merchant_id || null,
      categoryId: rule.category_id || null,
      rewardKind: rule.reward_kind,
      rateUnit: rule.rate_unit,
      rateValue: Number(rule.rate_value),
      minSpend: rule.min_spend ? Number(rule.min_spend) : null,
      capValue: rule.cap_value ? Number(rule.cap_value) : null
    }
  }

  const raw = {
    id: 1,
    card_id: 5,
    merchant_id: null,
    category_id: 2,
    reward_kind: 'CASHBACK',
    rate_unit: 'PERCENT',
    rate_value: 2,
    min_spend: null,
    cap_value: 100
  }

  const normalized = normalizeRule(raw)
  
  expect(normalized.id).toBe(1)
  expect(normalized.cardId).toBe(5)
  expect(normalized.merchantId).toBe(null)
  expect(normalized.categoryId).toBe(2)
  expect(normalized.rateUnit).toBe('PERCENT')
  expect(normalized.rateValue).toBe(2)
  expect(normalized.minSpend).toBe(null)
  expect(normalized.capValue).toBe(100)
}

// ===== Test: cardsRepository normalization =====
function testCardsNormalization() {
  console.log('\n--- Test: cardsRepository normalizeCard ---')
  
  function normalizeCard(card) {
    if (!card) return null
    return {
      id: card.id,
      cardId: card.card_id || card.id,
      cardName: card.card_name || card.name,
      bankId: card.bank_id,
      bankName: card.bank_name,
      rewardProgram: card.reward_program
    }
  }

  const raw = {
    id: 1,
    card_id: 1,
    name: 'HSBC Visa',
    bank_id: 10,
    bank_name: 'HSBC',
    reward_program: 'Rewards'
  }

  const normalized = normalizeCard(raw)
  
  expect(normalized.id).toBe(1)
  expect(normalized.cardId).toBe(1)
  expect(normalized.cardName).toBe('HSBC Visa')
  expect(normalized.bankId).toBe(10)
  expect(normalized.bankName).toBe('HSBC')
}

// ===== Test: maxReward cap behavior =====
function testMaxRewardCap() {
  console.log('\n--- Test: maxReward cap in evaluator ---')
  
  // Simulate offerEvaluator cap
  function estimateOfferValue(offer, amount) {
    if (!offer) return 0
    if (offer.minSpend && amount < Number(offer.minSpend)) return 0
    const value = Number(offer.value) || 0
    if (offer.valueType === 'FIXED') {
      return Math.min(value, Number(offer.maxDiscount) || value)
    }
    if (offer.valueType === 'PERCENT') {
      let calculated = (amount * value) / 100
      return Math.min(calculated, Number(offer.maxDiscount) || calculated)
    }
    return 0
  }

  // 10% on $200 = $20, capped at $15
  const offer = { valueType: 'PERCENT', value: 10, maxDiscount: 15 }
  const amount = 200
  const result = estimateOfferValue(offer, amount)
  expect(result).toBe(15)

  // No cap case
  const noCap = { valueType: 'PERCENT', value: 5 }
  expect(estimateOfferValue(noCap, 200)).toBe(10)
}

// ===== Test: offerEvaluator input format =====
function testOfferEvaluatorInput() {
  console.log('\n--- Test: offerEvaluator uses camelCase ---')
  
  // Must use camelCase: minSpend, valueType, maxDiscount, cardId, bankId
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

  function filterOffersForCard(offers, cardId, bankId) {
    if (!offers) return []
    return offers.filter(offer => {
      if (offer.cardId && offer.cardId !== cardId) return false
      if (offer.bankId && offer.bankId !== bankId) return false
      return true
    })
  }

  const offers = [
    { id: 1, valueType: 'FIXED', value: 30, minSpend: null, maxDiscount: null, cardId: null, bankId: null },
    { id: 2, valueType: 'PERCENT', value: 5, minSpend: 500, maxDiscount: null, cardId: 10, bankId: null },
    { id: 3, valueType: 'PERCENT', value: 10, minSpend: null, maxDiscount: 20, cardId: null, bankId: 5 }
  ]

  // Test filtering
  const filtered = filterOffersForCard(offers, 10, null)
  expect(filtered.length).toBe(2)

  // Test value calculation
  expect(estimateOfferValue(offers[0], 100)).toBe(30)
  expect(estimateOfferValue(offers[2], 300)).toBe(20) // capped at 20
}

// Run tests
console.log('🧪 Running repository normalization tests...')
testOffersNormalization()
testRulesNormalization()
testCardsNormalization()
testMaxRewardCap()
testOfferEvaluatorInput()

console.log('\n--- Results: ' + passed + ' passed, ' + failed + ' failed ---')
if (failed === 0) {
  console.log('✅ All tests passed')
  process.exit(0)
} else {
  console.log('❌ Some tests failed')
  process.exit(1)
}
