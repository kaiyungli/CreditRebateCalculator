/**
 * Offer Matcher v3 - Fixed source propagation + card mapping fix
 */

const SUPABASE_URL = 'https://qcvileuzjzoltwttrjli.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const BANK = { 'hsbc': 1, 'hangseng': 2, 'boc': 3, 'standard chartered': 4, 'citibank': 5 }
const CARDS = { 'everymile': {id:1,bank:1}, 'red': {id:1,bank:1}, 'chill': {id:3,bank:3} }
const MERCH = { '壽司郎':2, 'kaitai':1, '時代廣場':3, 'supermarket':4 }
const CAT = { 'dining':1, 'shopping':2, 'travel':3, '超市':4 }

function low(s) { return (s||'').toString().toLowerCase().trim() }

function match(offer) {
  const t = low(offer.title) + ' ' + low(offer.description || '')
  const s = low(offer.source) || ''
  
  // 1. Bank from SOURCE first (most reliable)
  let bank = null
  for(const k in BANK) if(s.includes(k)) { bank = BANK[k]; break }
  if(!bank) for(const k in BANK) if(t.includes(k)) { bank = BANK[k]; break }
  
  // 2. Card - text only
  let card = null
  for(const k in CARDS) if(t.includes(k)) card = CARDS[k].id
  
  // 3. Merchant
  let merch = null
  for(const k in MERCH) if(t.includes(k)) merch = MERCH[k]
  
  // 4. Category
  let cat = null
  for(const k in CAT) if(t.includes(k)) cat = CAT[k]
  
  return { bank_id:bank||null, card_id:card||null, merchant_id:merch||null, category_id:cat||null }
}

async function update(id,m) {
  if(!m.bank_id && !m.card_id && !m.merchant_id && !m.category_id) return
  await fetch(SUPABASE_URL+'/rest/v1/merchant_offers?id=eq.'+id, {
    method:'PATCH',
    headers:{'Content-Type':'application/json','apikey':SERVICE_KEY,'Authorization':'Bearer '+SERVICE_KEY},
    body:JSON.stringify({bank_id:m.bank_id, card_id:m.card_id, merchant_id:m.merchant_id, category_id:m.category_id})
  })
}

exports.run = async function() {
  // Get offers WITH source field (new ones have source)
  const res = await fetch(SUPABASE_URL+'/rest/v1/merchant_offers?select=id,title,source,bank_id&bank_id=is.null&limit=20', {
    headers:{'apikey':SERVICE_KEY,'Authorization':'Bearer '+SERVICE_KEY}
  })
  const offers = await res.json()
  console.log('Offers to match:', offers.length)
  
  let n = 0
  for(const o of offers) {
    const m = match(o)
    if(m.bank_id || m.merchant_id || m.category_id) {
      await update(o.id, m)
      n++
      console.log(o.id+': bank='+m.bank_id+' card='+m.card_id+' merch='+m.merchant_id+' cat='+m.category_id)
    }
  }
  console.log('Matched:', n)
}

exports.matchOffer = match
