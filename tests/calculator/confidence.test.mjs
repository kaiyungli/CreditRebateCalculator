/**
 * Confidence Model Tests (ESM)
 */

import { CONFIDENCE, calculateConfidence, needsReview, shouldPublish, detectConflict } from '../../src/domains/ingestion/confidence.js'

let passed = 0, failed = 0

function test(name, fn) {
  try { fn(); console.log('✅ ' + name); passed++; } catch(e) { console.log('❌ ' + name + ': ' + e.message); failed++; }
}

function eq(a, b, msg) { if (a !== b) throw new Error(`Expected ${b}, got ${a}${msg ? ': ' + msg : ''}`) }

// === CONFIDENCE ASSIGNMENT TESTS ===

test('HIGH: clear numeric, merchant, valid valueType', () => {
  const result = calculateConfidence({
    value: '5',
    valueType: 'PERCENT',
    merchantId: 1
  })
  eq(result.level, CONFIDENCE.HIGH, 'should be HIGH')
  eq(result.isValid, true)
})

test('MEDIUM: some fields but not all', () => {
  const result = calculateConfidence({
    value: '5',
    merchantId: 1
  })
  eq(result.level, CONFIDENCE.MEDIUM, 'should be MEDIUM')
  eq(result.isValid, true)
})

test('LOW: missing most fields', () => {
  const result = calculateConfidence({
    title: 'Some offer'
  })
  eq(result.level, CONFIDENCE.LOW, 'should be LOW')
  eq(result.isValid, false)
})

test('HIGH with all fields', () => {
  const result = calculateConfidence({
    value: '10',
    valueType: 'PERCENT',
    merchantId: 1,
    categoryId: 2,
    minSpend: '500'
  })
  eq(result.level, CONFIDENCE.HIGH)
})

test('MEDIUM with category but no merchant', () => {
  const result = calculateConfidence({
    value: '5',
    valueType: 'PERCENT',
    categoryId: 2
  })
  eq(result.level, CONFIDENCE.MEDIUM)
})

// === REVIEW TRIGGER TESTS ===

test('LOW confidence → review_needed', () => {
  const review = needsReview({}, { level: CONFIDENCE.LOW })
  eq(review.needed, true)
  eq(review.triggers.includes('low_confidence'), true)
})

test('near duplicate → review_needed', () => {
  const review = needsReview({value: '5'}, { level: CONFIDENCE.HIGH }, 'near')
  eq(review.needed, true)
  eq(review.triggers.includes('near_duplicate'), true)
})

test('conflict detected → review_needed', () => {
  const review = needsReview({value: '5'}, { level: CONFIDENCE.HIGH }, null, { type: 'conflict' })
  eq(review.needed, true)
  eq(review.triggers.includes('conflict_detected'), true)
})

test('HIGH confidence, no issues → no review', () => {
  const review = needsReview({value: '5'}, { level: CONFIDENCE.HIGH })
  eq(review.needed, false)
})

test('suspiciously high value → review', () => {
  const review = needsReview({ value: '75', valueType: 'PERCENT' }, { level: CONFIDENCE.HIGH })
  eq(review.needed, true)
  eq(review.triggers.includes('suspiciously_high_value'), true)
})

// === PUBLISH BEHAVIOR TESTS ===

test('missing value → invalid', () => {
  const result = shouldPublish({}, { level: CONFIDENCE.LOW })
  eq(result.decision, 'invalid')
  eq(result.reason, 'missing_value')
})

test('exact duplicate → skipped', () => {
  const result = shouldPublish({ value: '5' }, { level: CONFIDENCE.HIGH }, 'exact')
  eq(result.decision, 'skipped_duplicate')
})

test('LOW confidence still published with flag', () => {
  const result = shouldPublish({ value: '5' }, { level: CONFIDENCE.LOW })
  eq(result.decision, 'published')
  eq(result.reason, 'published_with_low_confidence')
})

test('normal publish', () => {
  const result = shouldPublish({ value: '5', valueType: 'PERCENT' }, { level: CONFIDENCE.HIGH })
  eq(result.decision, 'published')
  eq(result.reason, 'ok')
})

test('review_needed triggers review', () => {
  const result = shouldPublish({ value: '5' }, { level: CONFIDENCE.LOW })
  eq(result.decision, 'review_needed')
})

// === CONFLICT DETECTION ===

test('same merchant/card, different value → conflict', () => {
  const conflict = detectConflict(
    { merchantId: 1, cardId: 1, value: '10' },
    [{ merchant_id: 1, card_id: 1, value: '5', id: 1 }]
  )
  eq(conflict !== null, true)
  eq(conflict.type, 'different_value')
})

test('no conflict when no matches', () => {
  const conflict = detectConflict(
    { merchantId: 1, cardId: 1, value: '5' },
    [{ merchant_id: 2, card_id: 2, value: '5' }]
  )
  eq(conflict, null)
})

test('empty existing → no conflict', () => {
  const conflict = detectConflict({ merchantId: 1 }, [])
  eq(conflict, null)
})

console.log('\n=== RESULTS ===')
console.log(`Passed: ${passed}/${passed+failed}`)
console.log(`Failed: ${failed}`)
failed === 0 ? process.exit(0) : process.exit(1)
