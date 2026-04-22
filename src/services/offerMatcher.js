/**
 * Offer Matcher v2 - Simplified
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qcvileuzjzoltwttrjli.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const BANK = { 'hsbc': 1, 'hang seng': 2, 'boc': 3, '中銀': 3, 'standard chartered': 4, 'citibank': 5 }
const CARD = { 'everymile': 1, 'red': 1, 'chill': 3 }
const MERCHANT = { '壽司郎': 2, 'kaitai': 1, '時代廣場': 3, 'supermarket': 4 }
const CATEGORY = { 'dining': 1, 'shopping': 2, 'travel': 3, '超市': 4 }

function norm(t) { return (t||'').toLowerCase().trim() }

function match(offer) {
  const text = norm(offer.title) + ' ' + norm(offer.description)
  const src = norm(offer.source)
  
  let bankId = BANK[src] || BANK[text.split(' ')[0]]
  if (!bankId) for (const k in BANK) if (text.includes(k)) { bankId = BANK[k]; break }
  
  let cardId = null
  if (text.includes('everymile')) cardId = 1
  else if (text.includes('red')) cardId = 1
  else if (text.includes('chill')) cardId = 3
  
  let merchantId = MERCHANT[src]
  if (!merchantId) for (const k in MERCHANT) if (text.includes(k)) { merchantId = MERCHANT[k]; break }
  
  let categoryId = CATEGORY[src]
  if (!categoryId) for (const k in CATEGORY) if (text.includes(k)) { categoryId = CATEGORY[k]; break }
  
  return { bank_id: bankId, card_id: cardId, merchant_id: merchantId, category_id: categoryId }
}

async function update(id, m) {
  if (!m.bank_id && !m.card_id && !m.merchant_id && !m.category_id) return
  await fetch(SUPABASE_URL + '/rest/v1/merchant_offers?id=eq.'+id, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_KEY, 'Authorization': 'Bearer '+SERVICE_KEY },
    body: JSON.stringify({ bank_id: m.bank_id, card_id: m.card_id, merchant_id: m.merchant_id, category_id: m.category_id })
  })
}

exports.runMatching = async function() {
  const res = await fetch(SUPABASE_URL + '/rest/v1/merchant_offers?select=id,title,source&limit=20', { 
    headers: { 'apikey': SERVICE_KEY, 'Authorization': 'Bearer '+SERVICE_KEY } 
  })
  const offers = await res.json()
  let n = 0
  for (const o of offers) {
    const m = match(o)
    if (m.bank_id || m.merchant_id || m.category_id) { await update(o.id, m); n++ }
    console.log(o.id+': b='+m.bank_id+' c='+m.card_id+' m='+m.merchant_id+' cat='+m.category_id)
  }
  console.log('Matched:', n)
}

exports.matchOffer = match
