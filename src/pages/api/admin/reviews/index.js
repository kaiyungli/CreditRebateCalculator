/**
 * Admin API: List Review Offers
 * INTERNAL/ADMIN ONLY - NOT FOR PUBLIC USE
 */
const { listReviewOffers, getReviewStats } = require('../../../../domains/ingestion/services/reviewService')

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { limit = 20, offset = 0 } = req.query
      const result = await listReviewOffers({
        limit: parseInt(limit) || 20,
        offset: parseInt(offset) || 0
      })
      const stats = await getReviewStats()
      return res.status(200).json({ success: true, action: 'list', data: result.items, pagination: { limit: result.limit, offset: result.offset, count: result.count }, stats })
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message })
    }
  }
  return res.status(405).json({ success: false, error: 'Method not allowed' })
}
