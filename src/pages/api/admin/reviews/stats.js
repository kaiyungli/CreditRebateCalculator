const { getReviewStats } = require('../../../../domains/ingestion/services/reviewService')

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const stats = await getReviewStats()
      return res.status(200).json({ success: true, action: 'stats', data: stats })
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message })
    }
  }
  return res.status(405).json({ success: false, error: 'Method not allowed' })
}
