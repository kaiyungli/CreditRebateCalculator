/**
 * Input Resolution Tests
 */

let passed = 0, failed = 0

function test(name, fn) {
  try { fn(); console.log('✅ ' + name); passed++; } catch(e) { console.log('❌ ' + name + ': ' + e.message); failed++; }
}

function eq(a, b) { if (a !== b) throw new Error('Expected ' + b + ', got ' + a); }

function has(arr, val) { if (!arr.includes(val)) throw new Error('Missing: ' + val); }

function norm(i) {
  let em = i.merchant_id ? Number(i.merchant_id) : null
  let ec = i.category_id ? Number(i.category_id) : null
  let ass = []
  if(em){ if(i.category_id && ec) ass.push('input:merchantOverwritesCategory') }
  else if(ec) ass.push('input:categoryOnly')
  else ass.push('input:missing')
  return { effectiveMerchantId:em, effectiveCategoryId:ec, assumptions:ass }
}

test('I1: merchant only', () => { const r=norm({merchant_id:10}); eq(r.effectiveMerchantId,10) })
test('I2: category only', () => { const r=norm({category_id:5}); eq(r.effectiveCategoryId,5); has(r.assumptions,'input:categoryOnly') })
test('I3: merchant+match', () => { const r=norm({merchant_id:10,category_id:5}); eq(r.effectiveMerchantId,10); eq(r.effectiveCategoryId,5) })
test('I4: conflict noted', () => { const r=norm({merchant_id:10,category_id:5}); has(r.assumptions,'input:merchantOverwritesCategory') })
test('I5: neither', () => { const r=norm({}); eq(r.effectiveMerchantId,null); has(r.assumptions,'input:missing') })
test('I6: numbers', () => { const r=norm({merchant_id:'10',category_id:'5'}); eq(typeof r.effectiveMerchantId,'number') })

console.log('\nResults: '+(6-failed)+'/6 passed')
failed===0?process.exit(0):process.exit(1)
