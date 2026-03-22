// Debug: test getMerchantOffers
import { getActiveCards, getMerchantOffers } from '../../lib/db'

export default async function handler(req, res) {
  try {
    const cards = await getActiveCards()
    
    const cardIds = cards.map(c => c.id)
    const bankIds = [...new Set(cards.map(c => c.bank_id).filter(Boolean))]
    
    const offers = await getMerchantOffers({
      merchantId: 1,
      cardIds,
      bankIds
    })
    
    res.status(200).json({
      cards: cards.map(c => ({ id: c.id, bank_id: c.bank_id, name: c.card_name })),
      cardIds,
      bankIds,
      offers
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
