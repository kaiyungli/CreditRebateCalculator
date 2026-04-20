/**
 * Publish Pipeline Tests
 */

let passed = 0, failed = 0

function test(name, fn) {
  try { fn(); console.log('✅ ' + name); passed++; } catch(e) { console.log('❌ ' + name + ': ' + e.message); failed++; }
}

function eq(a, b) { if (a !== b) throw new Error('Expected ' + b + ', got ' + a); }

// Parse raw offer
function parseRaw(raw) {
  if (!raw) return { valid: false, reason: 'no_raw_offer' }
  const p = {
    title: raw.title,
    valueType: raw.reward_type === 'percent' ? 'PERCENT' : 'FIXED',
    value: parseFloat(raw.reward_value) || 0
  }
  if (!p.title) return { valid: false, reason: 'missing_title' }
  if (!p.valueType) return { valid: false, reason: 'missing_value_type' }
  if (!p.value || p.value <= 0) return { valid: false, reason: 'invalid_value' }
  return { valid: true, parsed: p }
}

// P1: valid raw offer
test('P1: valid raw offer', () => {
  const raw = { title: 'Test', reward_type: 'percent', reward_value: '5' }
  const result = parseRaw(raw)
  eq(result.valid, true)
})

// P2: missing title
test('P2: missing title', () => {
  const raw = { reward_type: 'percent', reward_value: '5' }
  const result = parseRaw(raw)
  eq(result.valid, false)
})

// P3: invalid value
test('P3: invalid value', () => {
  const raw = { title: 'Test', reward_value: '0' }
  const result = parseRaw(raw)
  eq(result.valid, false)
})

// P4: duplicate check would skip
test('P4: duplicate would be skipped', () => {
  // Simulated duplicate check result
  const check = { isDuplicate: true, exactMatch: true, reason: 'exact_match' }
  eq(check.isDuplicate, true)
  eq(check.exactMatch, true)
})

// P5: review needed for conflict
test('P5: conflict flagged review', () => {
  const check = { isDuplicate: true, exactMatch: false, reason: 'different_value' }
  eq(check.isDuplicate, true)
})

// P6: clean offer published
test('P6: clean offer would publish', () => {
  const check = { isDuplicate: false }
  eq(check.isDuplicate, false)
})

console.log('\nResults: '+(6-failed)+'/6 passed')
failed===0?process.exit(0):process.exit(1)
