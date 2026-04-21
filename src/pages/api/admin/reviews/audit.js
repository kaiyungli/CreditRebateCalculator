const { getReviewAudit } = require('../../../../domains/ingestion/services/reviewService')

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { id } = req.query
      if (!id) return res.status(400).json({ success: false, error: 'Missing required query: id' })
      const audit = await getReviewAudit(parseInt(id))
      return res.status(200).json({ success: true, action: 'audit', data: audit })
    } catch (e) {
      return res.status(404).json({ success: false, error: e.message })
    }
  }
  return res.status(405).json({ success: false, error: 'Method not allowed' })
}
