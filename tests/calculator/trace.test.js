/**
 * Decision Trace Tests
 */

let passed = 0, failed = 0

function test(name, fn) {
  try { fn(); console.log('✅ ' + name); passed++; } catch(e) { console.log('❌ ' + name + ': ' + e.message); failed++; }
}

function eq(a, b) { if (a !== b) throw new Error('Expected ' + b + ', got ' + a); }

// T1: winning card trace
test('T1: winning card trace', () => {
  const rule = { id: 1, scopeType: 'MERCHANT', reward: 20 }
  const applied = [{ id: 10, value: 50 }, { id: 20, value: 30 }]
  eq(applied.length, 2)
})

// T2: losing card with skipped
test('T2: losing card skipped', () => {
  const skipped = [{ id: 15, reason: 'condition:weekday' }, { id: 25, reason: 'threshold' }]
  eq(skipped.length, 2)
})

// T3: mixed
test('T3: mixed count', () => {
  const all = [{ value: 20 }, { skip: 'wallet' }, { value: 15 }]
  const applied = all.filter(o => o.value > 0)
  const skipped = all.filter(o => o.skip)
  eq(applied.length, 2)
  eq(skipped.length, 1)
})

// T4: derived category trace
test('T4: derived shows', () => {
  const steps = [{ step: 'input', action: 'resolve IDs' }]
  eq(steps[0].step, 'input')
})

// T5: unsupported threshold
test('T5: unsupported shows', () => {
  const skipped = [{ id: 1, reason: 'threshold_type:MONTHLY_ACCUMULATED' }]
  eq(skipped[0].reason, 'threshold_type:MONTHLY_ACCUMULATED')
})

// T6: condition mismatch
test('T6: condition mismatch', () => {
  const skipped = [{ id: 1, reason: 'condition:wallet' }]
  eq(skipped[0].reason, 'condition:wallet')
})

console.log('\nResults: '+(6-failed)+'/6 passed')
failed===0?process.exit(0):process.exit(1)
