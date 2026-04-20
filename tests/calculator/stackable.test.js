/**
 * Stackable v1 Tests
 */

let passed = 0
let failed = 0

function test(name, fn) {
  try { fn(); console.log('✅ ' + name); passed++; } catch(e) { console.log('❌ ' + name + ': ' + e.message); failed++; }
}

function eq(a, b) { if (a !== b) throw new Error('Expected ' + b + ', got ' + a); }
function ok(a) { if (!a) throw new Error('Expected truthy'); }
function no(a) { if (a) throw new Error('Expected falsy'); }

// Mock estimateOfferValue
function estimateOfferValue(offer, amount) {
  if (!offer || !offer.valueType) return 0
  if (offer.minSpend && amount < offer.minSpend) return 0
  const value = offer.valueType === 'FIXED' ? offer.value : (amount * offer.value / 100)
  return offer.maxReward ? Math.min(value, offer.maxReward) : value
}

// Stackable v1 logic
function calculateTotalOfferValue(offers, amount) {
  if (!offers || offers.length === 0) return 0
  const stackable = offers.filter(o => o.stackable === true)
  const nonStackable = offers.filter(o => o.stackable !== true)
  const stackableValue = stackable.reduce((sum, o) => sum + estimateOfferValue(o, amount), 0)
  const nonStackableValues = nonStackable.map(o => estimateOfferValue(o, amount))
  if (nonStackable.length > 0) {
    return Math.max(...nonStackableValues)
  }
  return stackableValue
}

// Test 1: multiple stackable offers → sum
test('S1: stackable sum', () => {
  const offers = [
    { id: 1, valueType: 'FIXED', value: 10, stackable: true },
    { id: 2, valueType: 'FIXED', value: 15, stackable: true }
  ]
  eq(calculateTotalOfferValue(offers, 100), 25)
})

// Test 2: one non-stackable offer → apply it
test('S2: non-stackable single', () => {
  const offers = [
    { id: 1, valueType: 'FIXED', value: 30, stackable: false }
  ]
  eq(calculateTotalOfferValue(offers, 100), 30)
})

// Test 3: two non-stackable offers → choose highest
test('S3: non-stackable highest', () => {
  const offers = [
    { id: 1, valueType: 'FIXED', value: 20, stackable: false },
    { id: 2, valueType: 'FIXED', value: 35, stackable: false }
  ]
  eq(calculateTotalOfferValue(offers, 100), 35)
})

// Test 4: mixed → choose highest non-stackable only (v1 rule)
test('S4: mixed stackable+non', () => {
  const offers = [
    { id: 1, valueType: 'FIXED', value: 10, stackable: true },
    { id: 2, valueType: 'FIXED', value: 25, stackable: false }
  ]
  // Should pick non-stackable only = 25
  eq(calculateTotalOfferValue(offers, 100), 25)
})

// Test 5: no offers → zero
test('S5: no offers', () => {
  eq(calculateTotalOfferValue([], 100), 0)
})

// Test 6: stackable with minSpend met
test('S6: stackable with minSpend', () => {
  const offers = [
    { id: 1, valueType: 'FIXED', value: 20, stackable: true, minSpend: 50 }
  ]
  eq(calculateTotalOfferValue(offers, 100), 20)
})

// Test 7: stackable with minSpend NOT met
test('S7: stackable minSpend blocked', () => {
  const offers = [
    { id: 1, valueType: 'FIXED', value: 20, stackable: true, minSpend: 500 }
  ]
  eq(calculateTotalOfferValue(offers, 100), 0)
})

console.log('\nResults: ' + (7 - failed) + '/7 passed')
failed === 0 ? process.exit(0) : process.exit(1)
