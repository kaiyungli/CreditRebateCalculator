const { rejectReviewOffer } = require('../../../../domains/ingestion/services/reviewService')

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { id, reason = 'manual_reject', rejectedBy = 'system' } = req.body
      if (!id) return res.status(400).json({ success: false, error: 'Missing required field: id' })
      const result = await rejectReviewOffer(parseInt(id), reason, rejectedBy)
      return res.status(200).json({ success: result.success, action: 'reject', status: 'rejected', data: result })
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message })
    }
  }
  return res.status(405).json({ success: false, error: 'Method not allowed' })
}
