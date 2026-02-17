// API: Get all cards
import { getCards } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' })

  const { bank_id, card_type, limit } = req.query

  try {
    const cards = await getCards({
      bank_id: bank_id ? parseInt(bank_id, 10) : undefined,
      card_type: card_type || undefined,
      limit: limit ? parseInt(limit, 10) : 50,
    })

    return res.status(200).json({ cards, count: cards.length })
  } catch (error) {
    console.error('Error fetching cards:', error)
    return res.status(500).json({ error: error.message })
  }
}
