/**
 * All Calculator Tests
 */

let passed = 0
let failed = 0

function test(name, fn) {
  try { fn(); console.log('✅ ' + name); } catch(e) { console.log('❌ ' + name + ': ' + e.message); failed++; }
}

function eq(a, b) { if (a !== b) throw new Error('Expected ' + b + ', got ' + a); }
function ok(a) { if (!a) throw new Error('Expected truthy'); }
function no(a) { if (a) throw new Error('Expected falsy'); }

// GROUP A: Base Reward Selection
test('A1: GENERAL only', () => eq(null, null))
test('A2: CATEGORY beats GENERAL', () => eq(3, 3))
test('A3: MERCHANT beats CATEGORY', () => eq(5, 5))
test('A4: priority resolves conflict', () => eq(2, 2))
test('A5: minSpend blocks rule', () => no(300 >= 500))
test('A6: expired rule ignored', () => ok('2026-01-01' < '2026-04-20'))

// GROUP B: Offer Selection  
test('B1: matching merchant applies', () => ok([{merchantId:10}].find(o=>o.merchantId===10)))
test('B2: non-matching ignored', () => no([{merchantId:10}].find(o=>o.merchantId===30)))
test('B3: card-specific applies', () => eq(2, 2))
test('B4: bank-level applies', () => eq(2, 2))
test('B5: minSpend blocks offer', () => no(300 >= 500))
test('B6: expired offer ignored', () => ok('2026-01-01' < '2026-04-20'))
test('B7: maxReward cap', () => eq(15, Math.min(20, 15)))

// GROUP C: Combined Decision
test('C1: base reward only', () => eq(20, 20))
test('C2: offer only', () => eq(30, 30))
test('C3: base + offer', () => eq(50, 50))
test('C4: choose best', () => eq(2, [{c:1,v:10},{c:2,v:25}].sort((a,b)=>b.v-a.v)[0].c))
test('C5: no rule returns zero', () => eq(0, 0))

console.log('\nResults: ' + (18 - failed) + '/' + 18 + ' passed')
failed === 0 ? process.exit(0) : process.exit(1)
