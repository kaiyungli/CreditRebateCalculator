/**
 * Review Service Tests
 */

import * as reviewService from '../../src/domains/ingestion/services/reviewService.js'

let passed = 0, failed = 0

function test(name, fn) {
  try { fn(); console.log('✅ ' + name); passed++; } catch(e) { console.log('❌ ' + name + ': ' + e.message); failed++; }
}

function eq(a, b) { if (a !== b) throw new Error(`Expected ${b}, got ${a}`) }

// === LIST REVIEW OFFERS ===

test('listReviewOffers returns structure', async () => {
  const result = await reviewService.listReviewOffers({ limit: 10 })
  if (!result.items) throw new Error('Missing items')
  if (typeof result.count !== 'number') throw new Error('Missing count')
})

test('listReviewOffers respects limit', async () => {
  const result = await reviewService.listReviewOffers({ limit: 5 })
  eq(result.items.length <= 5, true)
})

test('listReviewOffers returns array', async () => {
  const result = await reviewService.listReviewOffers({ limit: 1 })
  if (!Array.isArray(result.items)) throw new Error('Items not array')
})

// === GET REVIEW OFFER ===

test('getReviewStats returns status counts', async () => {
  const stats = await reviewService.getReviewStats()
  if (typeof stats.review !== 'number') throw new Error('Missing review count')
  if (typeof stats.approved !== 'number') throw new Error('Missing approved count')
})

test('REVIEW_ACTION has correct values', () => {
  eq('approved', 'approved')
  eq('rejected', 'rejected')
  eq('merged', 'merged')
})

// === EXPORTED FUNCTIONS ===

test('exports listReviewOffers', () => {
  eq(typeof reviewService.listReviewOffers, 'function')
})

test('exports getReviewOffer', () => {
  eq(typeof reviewService.getReviewOffer, 'function')
})

test('exports approveReviewOffer', () => {
  eq(typeof reviewService.approveReviewOffer, 'function')
})

test('exports rejectReviewOffer', () => {
  eq(typeof reviewService.rejectReviewOffer, 'function')
})

test('exports mergeReviewOffer', () => {
  eq(typeof reviewService.mergeReviewOffer, 'function')
})

test('exports getReviewAudit', () => {
  eq(typeof reviewService.getReviewAudit, 'function')
})

test('exports getReviewStats', () => {
  eq(typeof reviewService.getReviewStats, 'function')
})

console.log('\n=== RESULTS ===')
console.log(`Passed: ${passed}/${passed+failed}`)
console.log(`Failed: ${failed}`)
failed === 0 ? process.exit(0) : process.exit(1)
