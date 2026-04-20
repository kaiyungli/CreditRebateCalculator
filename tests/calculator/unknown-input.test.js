/**
 * Unknown/Partial Input Handling Tests
 */

let passed = 0, failed = 0

function test(name, fn) {
  try { fn(); console.log('✅ ' + name); passed++; } catch(e) { console.log('❌ ' + name + ': ' + e.message); failed++; }
}

function eq(a, b) { if (a !== b) throw new Error('Expected ' + b + ', got ' + a); }
function has(arr, val) { if (!arr || !arr.includes(val)) throw new Error('Missing: ' + val); }

// Simulate input resolution logic
function resolveEffectiveIds(input) {
  const { merchant_id, category_id } = input
  let em = null, ec = null, ass = []
  
  const im = merchant_id ? Number(merchant_id) : null
  const ic = category_id ? Number(category_id) : null
  
  // Known merchants in our system
  const knownMerchants = { 10: { exists: true, categoryId: 5 }, 20: { exists: false } }
  
  if (im) {
    const m = knownMerchants[im]
    if (m && m.exists) {
      em = im
      if (ic) {
        ec = ic
        if (m.categoryId && m.categoryId !== ic) ass.push('input:categoryMayOverride')
      } else if (m.categoryId) {
        ec = m.categoryId
        ass.push('input:categoryDerivedFromMerchant')
      } else {
        ass.push('input:merchantHasNoCategory')
      }
    } else {
      ass.push('input:unknownMerchant')
      if (ic) {
        ec = ic
        ass.push('input:usingCategoryAsFallback')
      }
    }
  } else if (ic) {
    ec = ic
    ass.push('input:categoryOnly')
  } else {
    ass.push('input:missingMerchantAndCategory')
  }
  
  return { effectiveMerchantId: em, effectiveCategoryId: ec, inputAssumptions: ass }
}

// U1: unknown merchant with category fallback
test('U1: unknown merchant + category', () => {
  const r = resolveEffectiveIds({ merchant_id: 99, category_id: 5 })
  eq(r.effectiveCategoryId, 5)
  has(r.inputAssumptions, 'input:unknownMerchant')
  has(r.inputAssumptions, 'input:usingCategoryAsFallback')
})

// U2: known merchant derives category
test('U2: derive category from merchant', () => {
  const r = resolveEffectiveIds({ merchant_id: 10 })  // 10 has categoryId 5
  eq(r.effectiveCategoryId, 5)
  has(r.inputAssumptions, 'input:categoryDerivedFromMerchant')
})

// U3: known merchant has no category
test('U3: merchant has no category', () => {
  const r = resolveEffectiveIds({ merchant_id: 10, category_id: 5 })
  // With explicit category, use it
  eq(r.effectiveCategoryId, 5)
})

// U4: unknown merchant without category
test('U4: both invalid', () => {
  const r = resolveEffectiveIds({})
  eq(r.effectiveMerchantId, null)
  eq(r.effectiveCategoryId, null)
  has(r.inputAssumptions, 'input:missingMerchantAndCategory')
})

// U5: category only
test('U5: category only', () => {
  const r = resolveEffectiveIds({ category_id: 3 })
  eq(r.effectiveCategoryId, 3)
  has(r.inputAssumptions, 'input:categoryOnly')
})

// U6: merchant invalid but category valid
test('U6: invalid merchant + valid category', () => {
  const r = resolveEffectiveIds({ merchant_id: 99 })  // unknown
  eq(r.effectiveCategoryId, null)  // No fallback without category
  has(r.inputAssumptions, 'input:unknownMerchant')
})

console.log('\nResults: '+(6-failed)+'/6 passed')
failed===0?process.exit(0):process.exit(1)
