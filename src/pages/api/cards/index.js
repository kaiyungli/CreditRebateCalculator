import { getActiveCards } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' })

  const { bank_id } = req.query

  try {
    let cards = await getActiveCards()
    
    // Filter by bank_id if provided
    if (bank_id) {
      cards = cards.filter(c => c.bank_id === parseInt(bank_id, 10))
    }

    return res.status(200).json({ cards, count: cards.length })
  } catch (error) {
    console.error('Error fetching cards:', error)
    return res.status(500).json({ error: error.message })
  }
}
