/**
 * Review Action Safeguard Tests
 */

import { 
  REVIEW_ACTION, 
  validateReviewPreconditions,
  buildAuditPayload,
  parseStatusNotes
} from '../../src/domains/ingestion/actions.js'

let passed = 0, failed = 0

function test(name, fn) {
  try { fn(); console.log('✅ ' + name); passed++; } catch(e) { console.log('❌ ' + name + ': ' + e.message); failed++; }
}

function eq(a, b) { if (a !== b) throw new Error(`Expected ${b}, got ${a}`) }

// === PRECONDITION VALIDATION ===

test('approve blocked if not in review state', () => {
  const result = validateReviewPreconditions({ status: 'published', id: 1 })
  eq(result.valid, false)
  if (!result.errors[0].includes('Invalid starting state')) throw new Error('Wrong error')
})

test('reject blocked if not in review state', () => {
  const result = validateReviewPreconditions({ status: 'new', id: 1 })
  eq(result.valid, false)
})

test('approve allowed if in review state', () => {
  const result = validateReviewPreconditions({ status: 'review', id: 1 })
  eq(result.valid, true)
})

test('reject allowed if in review state', () => {
  const result = validateReviewPreconditions({ status: 'review', id: 1 })
  eq(result.valid, true)
})

test('merge allowed if in review state', () => {
  const result = validateReviewPreconditions({ status: 'review', id: 1 })
  eq(result.valid, true)
})

test('blocked if raw offer null', () => {
  const result = validateReviewPreconditions(null)
  eq(result.valid, false)
  if (!result.errors[0].includes('not found')) throw new Error('Wrong error')
})

// === AUDIT PAYLOAD ===

test('approve has action and timestamp', () => {
  const payload = buildAuditPayload(REVIEW_ACTION.APPROVE, { fingerprint: 'abc123' })
  eq(payload.action, REVIEW_ACTION.APPROVE)
  if (!payload.timestamp) throw new Error('Missing timestamp')
  eq(payload.fingerprint, 'abc123')
})

test('reject includes reason', () => {
  const payload = buildAuditPayload(REVIEW_ACTION.REJECT, { reason: 'invalid_offer' })
  eq(payload.action, REVIEW_ACTION.REJECT)
  eq(payload.reason, 'invalid_offer')
})

test('merge includes targetMerchantOfferId', () => {
  const payload = buildAuditPayload(REVIEW_ACTION.MERGE, { targetMerchantOfferId: 123 })
  eq(payload.action, REVIEW_ACTION.MERGE)
  eq(payload.targetMerchantOfferId, 123)
})

test('duplicate check included when present', () => {
  const payload = buildAuditPayload(REVIEW_ACTION.APPROVE, { 
    fingerprint: 'fp',
    duplicateCheck: { result: 'skipped_duplicate', duplicateId: 1 }
  })
  eq(payload.duplicateCheck.result, 'skipped_duplicate')
  eq(payload.duplicateCheck.duplicateId, 1)
})

test('all fields present for full audit', () => {
  const payload = buildAuditPayload(REVIEW_ACTION.APPROVE, {
    reason: 'manual_approve',
    targetMerchantOfferId: 5,
    fingerprint: 'fp123',
    confidence: 'MEDIUM',
    originalStatus: 'review'
  })
  eq(payload.action, REVIEW_ACTION.APPROVE)
  eq(payload.reason, 'manual_approve')
  eq(payload.targetMerchantOfferId, 5)
  eq(payload.fingerprint, 'fp123')
  eq(payload.confidence, 'MEDIUM')
  eq(payload.originalStatus, 'review')
})

// === STATUS NOTES PARSING ===

test('parse valid JSON', () => {
  const result = parseStatusNotes('{"action":"approved"}')
  eq(result.action, 'approved')
})

test('parse null returns empty', () => {
  const result = parseStatusNotes(null)
  eq(Object.keys(result).length, 0)
})

test('parse invalid JSON returns empty', () => {
  const result = parseStatusNotes('not json')
  eq(Object.keys(result).length, 0)
})

// === STATUS TRANSITIONS ===

test('Approved status is "approved"', () => {
  eq(REVIEW_ACTION.APPROVE, 'approved')
})

test('Rejected status is "rejected"', () => {
  eq(REVIEW_ACTION.REJECT, 'rejected')
})

test('Merged status is "merged"', () => {
  eq(REVIEW_ACTION.MERGE, 'merged')
})

console.log('\n=== RESULTS ===')
console.log(`Passed: ${passed}/${passed+failed}`)
console.log(`Failed: ${failed}`)
failed === 0 ? process.exit(0) : process.exit(1)
