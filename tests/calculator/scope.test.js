console.log('=== Scope Matching Tests ===')

function matchesScope(offer, request, card) {
  const scope = offer.scope_type
  if (!scope || scope === 'GENERAL') return true
  if (scope === 'MERCHANT') return offer.merchant_id === request.merchant_id
  if (scope === 'CATEGORY') return offer.category_id === request.category_id
  if (scope === 'MERCHANT_CATEGORY') return offer.merchant_id === request.merchant_id && offer.category_id === request.category_id
  if (scope === 'CARD_WIDE') return offer.card_id === card?.card_id
  if (scope === 'BANK_WIDE') return offer.bank_id === card?.bank_id
  return false
}

const tests = [
  { name: 'wrong merchant', offer: {scope_type:'MERCHANT', merchant_id:2}, request:{merchant_id:1}, card:{}, expect:false },
  { name: 'right merchant', offer: {scope_type:'MERCHANT', merchant_id:1}, request:{merchant_id:1}, card:{}, expect:true },
  { name: 'wrong category', offer: {scope_type:'CATEGORY', category_id:2}, request:{category_id:1}, card:{}, expect:false },
  { name: 'MIXED both', offer: {scope_type:'MERCHANT_CATEGORY', merchant_id:1, category_id:2}, request:{merchant_id:1, category_id:2}, card:{}, expect:true },
  { name: 'MIXED one mismatch', offer: {scope_type:'MERCHANT_CATEGORY', merchant_id:1, category_id:2}, request:{merchant_id:1, category_id:1}, card:{}, expect:false },
  { name: 'CARD_WIDE wrong', offer: {scope_type:'CARD_WIDE', card_id:1}, request:{}, card:{card_id:2}, expect:false },
  { name: 'CARD_WIDE right', offer: {scope_type:'CARD_WIDE', card_id:1}, request:{}, card:{card_id:1}, expect:true },
  { name: 'BANK_WIDE wrong', offer: {scope_type:'BANK_WIDE', bank_id:1}, request:{}, card:{bank_id:2}, expect:false },
  { name: 'BANK_WIDE right', offer: {scope_type:'BANK_WIDE', bank_id:1}, request:{}, card:{bank_id:1}, expect:true },
  { name: 'GENERAL', offer: {scope_type:'GENERAL'}, request:{}, card:{}, expect:true },
]

let p = 0
for (const t of tests) {
  const r = matchesScope(t.offer, t.request, t.card)
  const ok = r === t.expect
  if (ok) p++
  console.log((ok?'✓':'✗')+' '+t.name+': '+(ok?'PASS':'FAIL'))
}
console.log('\n'+p+'/'+tests.length+' passed')
