import { getActiveOffers, getAllActiveOffers } from '@/lib/offers'

export default async function handler(req, res) {
  const { merchantId, cardId, date, limit = 50 } = req.query

  try {
    let offers
    
    if (merchantId || cardId || date) {
      offers = await getActiveOffers({
        merchantId: merchantId ? parseInt(merchantId) : undefined,
        cardId: cardId ? parseInt(cardId) : undefined,
        date,
        amount: req.query.amount ? parseFloat(req.query.amount) : undefined
      })
    } else {
      offers = await getAllActiveOffers(parseInt(limit))
    }

    res.status(200).json({ 
      success: true, 
      offers,
      count: offers?.length || 0
    })
  } catch (error) {
    console.error('Error fetching offers:', error)
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
}
