// API: Calculate best card for a single transaction
// Entry point only - business logic moved to domain layer
import { calculateBestCard } from '../../../domains/calculator/services/calculator'

/**
 * Parse and validate request
 */
function parseRequest(body) {
  const parsed = typeof body === 'string' ? JSON.parse(body) : body
  const { merchant_id, category_id, amount, card_ids, user_id } = parsed

  // Validate required fields
  if (!amount || amount <= 0) {
    throw new Error('Invalid amount')
  }

  if (!merchant_id && !category_id) {
    throw new Error('merchant_id or category_id required')
  }

  return { merchant_id, category_id, amount, card_ids, user_id }
}

/**
 * Format response
 */
function formatResponse(input, result) {
  return {
    success: true,
    input,
    results: result.results,
    best_card: result.best_card
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'POST only' })
  }

  try {
    // Parse request
    const input = parseRequest(req.body)

    // Call domain service
    const result = await calculateBestCard(input)

    // Return response
    return res.status(200).json(formatResponse(input, result))

  } catch (error) {
    console.error('Calculate API error:', error.message)
    return res.status(400).json({ success: false, error: error.message })
  }
}
