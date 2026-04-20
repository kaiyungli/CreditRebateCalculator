/**
 * Fingerprint and Canonicalization Tests
 */

let passed = 0, failed = 0

function test(name, fn) {
  try { fn(); console.log('✅ ' + name); passed++; } catch(e) { console.log('❌ ' + name + ': ' + e.message); failed++; }
}

function eq(a, b) { if (a !== b) throw new Error('Expected ' + b + ', got ' + a); }

// Canonicalize
function canon(c) {
  if (!c) return ''
  if (typeof c !== 'object') return ''
  function rec(o) {
    if (o === null) return ''
    if (typeof o === 'string') return o.toLowerCase().trim()
    if (typeof o === 'number') return String(o)
    if (Array.isArray(o)) return o.map(rec).filter(Boolean).sort().join(',')
    if (typeof o === 'object') return Object.keys(o).sort().map(k => k + '=' + rec(o[k])).join('|')
    return ''
  }
  return rec(c)
}

// Fingerprint
function fp(o) {
  if (!o) return null
  const id = {
    merchant_id: o.merchantId || null,
    bank_id: o.bankId || null,
    card_id: o.cardId || null,
    category_id: o.categoryId || null,
    offer_type: o.offerType || 'general',
    value_type: o.valueType || 'PERCENT',
    value: Number(o.value) || 0,
    min_spend: o.minSpend || null,
    max_reward: o.maxReward || null,
    stackable: o.stackable === true,
    threshold_type: o.thresholdType || 'PER_TXN',
    conditions: canon(o.conditions)
  }
  const parts = [id.merchant_id,id.bank_id,id.card_id,id.category_id,id.offer_type,id.value_type,id.value,id.min_spend,id.max_reward,id.stackable?'1':'0',id.threshold_type,id.conditions].map(v=>v===null||v===undefined?'':String(v))
  return parts.join('|')
}

// F1: same conditions different key order
test('F1: key order', () => {
  const c1 = { channel: 'online', wallet: 'apple' }
  const c2 = { wallet: 'apple', channel: 'online' }
  eq(canon(c1), canon(c2))
})

// F2: array order
test('F2: array order', () => {
  const c1 = { tags: ['a', 'b', 'c'] }
  const c2 = { tags: ['c', 'a', 'b'] }
  eq(canon(c1), canon(c2))
})

// F3: value casing
test('F3: casing', () => {
  const c1 = { channel: 'ONLINE' }
  const c2 = { channel: 'online' }
  eq(canon(c1), canon(c2))
})

// F4: different minSpend -> different
test('F4: minSpend diff', () => {
  const o1 = { merchantId: 10, value: 5, minSpend: 100 }
  const o2 = { merchantId: 10, value: 5, minSpend: 200 }
  eq(fp(o1) === fp(o2), false)
})

// F5: different value -> different
test('F5: value diff', () => {
  const o1 = { merchantId: 10, value: 5 }
  const o2 = { merchantId: 10, value: 10 }
  eq(fp(o1) === fp(o2), false)
})

// F6: same offer same fingerprint
test('F6: identical', () => {
  const o1 = { merchantId: 10, value: 5, minSpend: 100 }
  const o2 = { merchantId: 10, value: 5, minSpend: 100 }
  eq(fp(o1), fp(o2))
})

// F7: stackable flag
test('F7: stackable flag', () => {
  const o1 = { merchantId: 10, value: 5, stackable: true }
  const o2 = { merchantId: 10, value: 5, stackable: false }
  eq(fp(o1) === fp(o2), false)
})

console.log('\nResults: '+(7-failed)+'/7 passed')
failed===0?process.exit(0):process.exit(1)
