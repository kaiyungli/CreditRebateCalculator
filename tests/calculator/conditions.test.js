/**
 * conditions_json v1 Tests
 */

let passed = 0
let failed = 0

function test(name, fn) {
  try { fn(); console.log('✅ ' + name); passed++; } catch(e) { console.log('❌ ' + name + ': ' + e.message); failed++; }
}

function eq(a, b) { if (a !== b) throw new Error('Expected ' + b + ', got ' + a); }
function ok(a) { if (!a) throw new Error('Expected truthy'); }
function no(a) { if (a) throw new Error('Expected falsy'); }

const SUPPORTED = ['channel', 'wallet', 'weekday']

function evaluateConditions(conditions, input = {}) {
  if (!conditions) return { satisfied: true }
  
  const unsupported = Object.keys(conditions).filter(k => !SUPPORTED.includes(k))
  if (unsupported.length > 0) {
    return { satisfied: true, assumption: `unsupportedConditionKey:${unsupported.join(',')}` }
  }
  
  if (conditions.channel && conditions.channel !== 'all') {
    if (conditions.channel !== (input.channel || 'all')) return { satisfied: false, reason: 'channel' }
  }
  if (conditions.wallet && conditions.wallet !== 'all') {
    if (conditions.wallet !== (input.wallet || 'all')) return { satisfied: false, reason: 'wallet' }
  }
  if (conditions.weekday && conditions.weekday !== 'all') {
    if (!input.weekday) return { satisfied: false, reason: 'weekday:missing_input' }
    if (conditions.weekday !== input.weekday) return { satisfied: false, reason: 'weekday' }
  }
  
  return { satisfied: true }
}

// C1: channel match
test('C1: channel match', () => {
  const condition = { channel: 'online' }
  const input = { channel: 'online' }
  eq(evaluateConditions(condition, input).satisfied, true)
})

// C2: channel mismatch
test('C2: channel mismatch', () => {
  const condition = { channel: 'in_store' }
  const input = { channel: 'online' }
  eq(evaluateConditions(condition, input).satisfied, false)
})

// C3: wallet match
test('C3: wallet match', () => {
  const condition = { wallet: 'apple_pay' }
  const input = { wallet: 'apple_pay' }
  eq(evaluateConditions(condition, input).satisfied, true)
})

// C4: wallet mismatch
test('C4: wallet mismatch', () => {
  const condition = { wallet: 'apple_pay' }
  const input = { wallet: 'google_pay' }
  eq(evaluateConditions(condition, input).satisfied, false)
})

// C5: weekday match
test('C5: weekday match', () => {
  const condition = { weekday: 'friday' }
  const input = { weekday: 'friday' }
  eq(evaluateConditions(condition, input).satisfied, true)
})

// C6: weekday missing transactionDate
test('C6: weekday missing', () => {
  const condition = { weekday: 'saturday' }
  const input = {}
  eq(evaluateConditions(condition, input).satisfied, false)
})

// C7: unknown key ignored with assumption
test('C7: unknown key ignored', () => {
  const condition = { channel: 'online', mcc: '5812' }  // mcc is not supported
  const input = { channel: 'online' }
  const result = evaluateConditions(condition, input)
  eq(result.satisfied, true)
  ok(result.assumption && result.assumption.includes('mcc'))
})

// C8: null/empty conditions
test('C8: null conditions', () => {
  eq(evaluateConditions(null, {}).satisfied, true)
})

// C9: all wildcard matches any
test('C9: all wildcard', () => {
  const condition = { channel: 'all', wallet: 'all' }
  const input = { channel: 'online', wallet: 'apple_pay' }
  eq(evaluateConditions(condition, input).satisfied, true)
})

console.log('\nResults: ' + (9 - failed) + '/9 passed')
failed === 0 ? process.exit(0) : process.exit(1)
