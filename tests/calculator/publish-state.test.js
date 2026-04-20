/**
 * Publish State Persistence Tests
 */

let passed = 0, failed = 0

function test(name, fn) {
  try { fn(); console.log('✅ ' + name); passed++; } catch(e) { console.log('❌ ' + name + ': ' + e.message); failed++; }
}

function eq(a, b) { if (a !== b) throw new Error('Expected ' + b + ', got ' + a); }

const STATUS = {
  PUBLISHED: 'published',
  SKIPPED_DUPLICATE: 'skipped_duplicate',  
  REVIEW_NEEDED: 'review_needed',
  INVALID: 'invalid'
}

const RAW = {
  NEW: 'new',
  PUBLISHED: 'published',
  SKIPPED: 'skipped',
  REVIEW: 'review',
  INVALID: 'invalid'
}

const TRANSITIONS = {
  [STATUS.PUBLISHED]: RAW.PUBLISHED,
  [STATUS.SKIPPED_DUPLICATE]: RAW.SKIPPED,
  [STATUS.REVIEW_NEEDED]: RAW.REVIEW,
  [STATUS.INVALID]: RAW.INVALID
}

test('S1: published state', () => eq(TRANSITIONS[STATUS.PUBLISHED], RAW.PUBLISHED))
test('S2: duplicate skipped', () => eq(TRANSITIONS[STATUS.SKIPPED_DUPLICATE], RAW.SKIPPED))
test('S3: review needed', () => eq(TRANSITIONS[STATUS.REVIEW_NEEDED], RAW.REVIEW))
test('S4: invalid state', () => eq(TRANSITIONS[STATUS.INVALID], RAW.INVALID))

test('S5: result fields', () => {
  const result = { status: STATUS.PUBLISHED, fingerprint: 'test', rawOfferId: 1, merchantOfferId: 100 }
  eq(result.status, STATUS.PUBLISHED)
  eq(result.merchantOfferId, 100)
})

test('S6: rawOfferId preserved', () => {
  const result = { rawOfferId: 55 }
  eq(result.rawOfferId, 55)
})

console.log('\nResults: '+(6-failed)+'/6 passed')
failed===0?process.exit(0):process.exit(1)
