/**
 * Search 優惠 API - GET /api/offers
 * 
 * Read-only API for merchant_offers
 * No calculator logic
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qcvileuzjzoltwttrjli.supabase.co'
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { 
    q,              // keyword search
    bank_id, 
    card_id, 
    merchant_id, 
    category_id, 
    calculation_mode,
    status,
    limit = 20,
    offset = 0
  } = req.query

  try {
    // Build query string
    let queryParams = []
    
    // Base filters - only ACTIVE unless explicitly requested
    if (!status) {
      queryParams.push('status.eq.ACTIVE')
    } else if (status !== 'all') {
      queryParams.push('status.eq.' + status)
    }
    
    // Specific filters
    if (bank_id) queryParams.push('bank_id.eq.' + bank_id)
    if (card_id) queryParams.push('card_id.eq.' + card_id)
    if (merchant_id) queryParams.push('merchant_id.eq.' + merchant_id)
    if (category_id) queryParams.push('category_id.eq.' + category_id)
    if (calculation_mode) queryParams.push('calculation_mode.eq.' + calculation_mode)
    
    // Build final URL
    let url = SUPABASE_URL + '/rest/v1/merchant_offers'
    if (queryParams.length > 0) {
      url += '?' + queryParams.join('&')
    } else {
      url += '?status.eq.ACTIVE'
    }
    
    // Keyword search - post-filter
    let allData = await fetch(url, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': 'Bearer ' + ANON_KEY
      }
    }).then(r => r.json())
    
    // Keyword filter
    if (q) {
      const qLower = q.toLowerCase()
      allData = allData.filter(o => 
        (o.title || '').toLowerCase().includes(qLower) ||
        (o.description || '').toLowerCase().includes(qLower)
      )
    }
    
    // Apply pagination
    const start = parseInt(offset)
    const end = start + parseInt(limit)
    const paginated = allData.slice(start, end)
    
    // Map response
    const offers = paginated.map(o => ({
      id: o.id,
      title: o.title,
      description: o.description,
      bank_id: o.bank_id,
      card_id: o.card_id,
      merchant_id: o.merchant_id,
      category_id: o.category_id,
      offer_type: o.offer_type,
      reward_kind: o.reward_kind,
      value: o.value,
      value_type: o.value_type,
      min_spend: o.min_spend,
      calculation_mode: o.calculation_mode,
      source_name: o.source_name,
      source_url: o.source_url,
      raw_offer_id: o.raw_offer_id,
      valid_from: o.valid_from,
      valid_to: o.valid_to
    }))
    
    return res.status(200).json({
      success: true,
      count: offers.length,
      total: allData.length,
      offset: start,
      limit: parseInt(limit),
      data: offers
    })
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}
