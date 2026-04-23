/**
 * Offer Parser v2.1
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qcvileuzjzoltwttrjli.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const NON_OFFER = ['phishing', 'fraud', 'security', 'support', 'login', 'account', 'payroll', '借貸']
const OFFER_KW = ['offer', 'cashback', 'discount', '回贈', 'reward', 'bonus', 'gift', '優惠', '獎賞', '減', '折', '戲飛', '送', '最高']

const CAT = {
  1: ['餐飲', '食', 'dining', 'food'],
  2: ['購物', 'shopping'],
  3: ['旅遊', 'travel', 'flight'],
  4: ['超市', 'supermarket', '惠康']
}

const BANK_MAP = {
  'hsbc': 1, '滙豐': 1, '汇丰': 1,
  'hang seng': 2, '恒生': 2,
  'boc': 3, '中銀': 3, '中國銀行': 3,
  'citi': 5, '花旗': 5,
  'aeon': 6,
  'dbs': 7, '星展': 7,
  '東亞': 8
}

function parse(raw) {
  const t = raw.title || ''
  const l = t.toLowerCase()
  
  // Skip invalid
  if (NON_OFFER.some(k => l.includes(k))) return { type: 'INVALID', id: raw.id }
  if (!OFFER_KW.some(k => l.includes(k)) && t.length < 12) return { type: 'SHORT', id: raw.id }
  
  // Category
  let cat = null
  for (const [id, kw] of Object.entries(CAT)) if (kw.some(k => l.includes(k))) { cat = parseInt(id); break }
  
  // Bank
  let bank = null
  for (const [name, id] of Object.entries(BANK_MAP)) if (l.includes(name)) { bank = id; break }
  
  // Type
  let ot = 'EXTRA_CASHBACK', rk = 'CASHBACK', vt = 'PERCENT'
  if (l.includes('折') || l.includes('discount')) { ot = 'CASH_DISCOUNT'; rk = 'DISCOUNT' }
  else if (l.includes('買一送一') || l.includes('戲飛')) { ot = 'DISPLAY_ONLY'; rk = 'PRIVILEGE' }
  else if (l.includes('里數') || l.includes('mile')) { ot = 'POINTS_BONUS'; rk = 'MILES' }
  else if (l.includes('申請') || l.includes('welcome')) { ot = 'WELCOME_BONUS'; rk = 'WELCOME' }
  
  // Value
  let v = 5
  const pm = l.match(/(\d+(\.\d+)?)%/)
  const dm = l.match(/\$\s*(\d+)/) || l.match(/送\s*(\d+)/)
  if (pm) v = parseFloat(pm[1])
  else if (dm) { v = parseInt(dm[1]); vt = 'FIXED' }
  
  return { type: 'PARSED', id: raw.id, data: { title: t, offer_type: ot, reward_kind: rk, value_type: vt, value: v, category_id: cat, bank_id: bank, status: 'PARSED' } }
}

async function run() {
  console.log('Parser v2.1')
  const res = await fetch(SUPABASE_URL + '/rest/v1/raw_offers?select=*', { headers: { 'apikey': SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY } })
  const offers = await res.json()
  const newOffers = offers.filter(o => o.status === 'new')
  
  console.log(`New: ${newOffers.length}`)
  
  let parsed = 0, review = 0
  
  for (const o of newOffers) {
    const r = parse(o)
    if (r.type === 'PARSED') {
      await fetch(SUPABASE_URL + '/rest/v1/raw_offers?id=eq.' + o.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY },
        body: JSON.stringify({ status: 'PARSED', status_notes: r.data.offer_type })
      })
      parsed++
      console.log(`✅ ${o.title?.substring(0,35)} → ${r.data.offer_type} v${r.data.value}`)
    } else {
      await fetch(SUPABASE_URL + '/rest/v1/raw_offers?id=eq.' + o.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY },
        body: JSON.stringify({ status: 'NEEDS_REVIEW', status_notes: r.type })
      })
      review++
      console.log(`📋 ${o.title?.substring(0,25)} → ${r.type}`)
    }
  }
  console.log(`Final: parsed=${parsed}, review=${review}`)
}

run().then(() => process.exit(0))
