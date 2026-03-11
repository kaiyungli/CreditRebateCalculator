import { getActiveOffers, getAllActiveOffers } from '@/lib/offers'

export default async function handler(req, res) {
  const { 
    merchant, 
    merchantName,
    cardId, 
    categoryId,
    date, 
    amount,
    verified,
    limit = 50 
  } = req.query

  try {
    let offers
    
    const params = {
      merchantName: merchant || merchantName,
      cardId: cardId ? parseInt(cardId) : undefined,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      date,
      amount: amount ? parseFloat(amount) : undefined,
      isVerified: verified === 'true'
    }
    
    if (merchant || merchantName || cardId || categoryId || date || amount || verified) {
      offers = await getActiveOffers(params)
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
