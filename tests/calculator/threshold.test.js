/**
 * threshold_type v1 Tests
 */

let passed = 0
let failed = 0

function test(name, fn) {
  try { fn(); console.log('✅ ' + name); passed++; } catch(e) { console.log('❌ ' + name + ': ' + e.message); failed++; }
}

function eq(a, b) { if (a !== b) throw new Error('Expected ' + b + ', got ' + a); }

// threshold_type v1 supported check
function isThresholdTypeSupported(offer) {
  return !offer.thresholdType || offer.thresholdType === 'PER_TXN'
}

function estimateOfferValue(offer, amount) {
  if (!offer) return 0
  // v1: Only PER_TXN supported
  if (!isThresholdTypeSupported(offer)) return 0
  if (offer.minSpend && amount < offer.minSpend) return 0
  const value = offer.valueType === 'FIXED' ? offer.value : (amount * offer.value / 100)
  return offer.maxReward ? Math.min(value, offer.maxReward) : value
}

// T1: PER_TXN + minSpend met
test('T1: PER_TXN supported', () => {
  const offer = { valueType: 'PERCENT', value: 5, thresholdType: 'PER_TXN' }
  eq(isThresholdTypeSupported(offer), true)
})

// T2: PER_TXN + minSpend meets requirement
test('T2: PER_TXN with minSpend', () => {
  const offer = { valueType: 'FIXED', value: 20, minSpend: 50, thresholdType: 'PER_TXN' }
  eq(estimateOfferValue(offer, 100), 20)
})

// T3: PER_TXN + minSpend blocked
test('T3: PER_TXN minSpend blocked', () => {
  const offer = { valueType: 'FIXED', value: 20, minSpend: 500, thresholdType: 'PER_TXN' }
  eq(estimateOfferValue(offer, 100), 0)
})

// T4: MONTHLY_ACCUMULATED - skipped
test('T4: MONTHLY skipped', () => {
  const offer = { valueType: 'PERCENT', value: 10, thresholdType: 'MONTHLY_ACCUMULATED' }
  eq(isThresholdTypeSupported(offer), false)
  eq(estimateOfferValue(offer, 100), 0)
})

// T5: CAMPAIGN_ACCUMULATED - skipped
test('T5: CAMPAIGN skipped', () => {
  const offer = { valueType: 'PERCENT', value: 10, thresholdType: 'CAMPAIGN_ACCUMULATED' }
  eq(isThresholdTypeSupported(offer), false)
  eq(estimateOfferValue(offer, 100), 0)
})

// T6: Mixed supported + unsupported
test('T6: mixed supported + unsupported', () => {
  const offers = [
    { valueType: 'FIXED', value: 20, minSpend: 50, thresholdType: 'PER_TXN' },
    { valueType: 'FIXED', value: 30, thresholdType: 'MONTHLY_ACCUMULATED' }
  ]
  // Only valid one should count
  const applicable = offers.filter(o => isThresholdTypeSupported(o))
  eq(applicable.length, 1)
})

// T7: Default thresholdType (null) treated as PER_TXN
test('T7: default thresholdType', () => {
  const offer = { valueType: 'PERCENT', value: 5 }  // no thresholdType
  eq(isThresholdTypeSupported(offer), true)
})

console.log('\nResults: ' + (7 - failed) + '/7 passed')
failed === 0 ? process.exit(0) : process.exit(1)
