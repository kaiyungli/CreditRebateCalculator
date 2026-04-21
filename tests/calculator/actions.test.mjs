/**
 * Review Action Tests
 */

import { REVIEW_ACTION, executeReviewAction } from '../../src/domains/ingestion/actions.js'

let passed = 0, failed = 0

function test(name, fn) {
  try { fn(); console.log('✅ ' + name); passed++; } catch(e) { console.log('❌ ' + name + ': ' + e.message); failed++; }
}

function eq(a, b) { if (a !== b) throw new Error(`Expected ${b}, got ${a}`) }

// === ACTION TYPES ===

test('REVIEW_ACTION has correct values', () => {
  eq(REVIEW_ACTION.APPROVE, 'approved')
  eq(REVIEW_ACTION.REJECT, 'rejected')
  eq(REVIEW_ACTION.MERGE, 'merged')
})

test('executeReviewAction rejects unknown action', async () => {
  let threw = false
  try {
    await executeReviewAction(1, 'unknown_action')
  } catch (e) {
    threw = true
    if (!e.message.includes('Unknown action')) throw e
  }
  eq(threw, true)
})

// === ACTION PAYLOADS ===

test('approveReview requires rawOfferId', async () => {
  let threw = false
  try {
    // Would fail on missing ID
    await executeReviewAction(null, REVIEW_ACTION.APPROVE)
  } catch (e) {
    threw = true
  }
  eq(threw, true)
})

test('rejectReview requires reason', async () => {
  let threw = false
  try {
    await executeReviewAction(1, REVIEW_ACTION.REJECT, { reason: '' })
  } catch (e) {
    threw = true
  }
  eq(threw, true)
})

test('mergeReview requires targetMerchantOfferId', async () => {
  let threw = false
  try {
    await executeReviewAction(1, REVIEW_ACTION.MERGE, { targetMerchantOfferId: null })
  } catch (e) {
    threw = true
  }
  eq(threw, true)
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
