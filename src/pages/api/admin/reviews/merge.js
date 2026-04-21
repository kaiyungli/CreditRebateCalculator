const { mergeReviewOffer } = require('../../../../domains/ingestion/services/reviewService')

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { id, targetMerchantOfferId, mergedBy = 'system' } = req.body
      if (!id) return res.status(400).json({ success: false, error: 'Missing required field: id' })
      if (!targetMerchantOfferId) return res.status(400).json({ success: false, error: 'Missing required field: targetMerchantOfferId' })
      const result = await mergeReviewOffer(parseInt(id), parseInt(targetMerchantOfferId), mergedBy)
      return res.status(200).json({ success: result.success, action: 'merge', status: 'merged', data: result })
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message })
    }
  }
  return res.status(405).json({ success: false, error: 'Method not allowed' })
}
