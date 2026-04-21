/**
 * Admin API: Single Review Offer
 * INTERNAL/ADMIN ONLY - NOT FOR PUBLIC USE
 */
const { getReviewOffer } = require('../../../../domains/ingestion/services/reviewService')

export default async function handler(req, res) {
  const { id } = req.query
  if (req.method === 'GET') {
    try {
      const offer = await getReviewOffer(parseInt(id))
      return res.status(200).json({ success: true, action: 'get', data: offer })
    } catch (e) {
      return res.status(404).json({ success: false, error: e.message })
    }
  }
  return res.status(405).json({ success: false, error: 'Method not allowed' })
}
