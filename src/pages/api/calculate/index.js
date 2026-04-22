/**
 * Calculator API - POST /api/calculate
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const { calculateBestCard } = require('../../../services/calculator')
    
    const result = await calculateBestCard(req.body)
    
    return res.status(200).json({
      success: true,
      ...result
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}
