// API: Calculate best card for a single transaction
// Entry point only - uses centralized schema validation
import { calculateBestCardForExpenses } from '../../../domains/calculator/services/calculator'
import { validateCalculationRequest } from '../../../shared/schemas/calculation'

/**
 * Format successful response (camelCase)
 */
function formatResponse(input, result) {
  return {
    success: true,
    input: {
      merchantId: input.merchant_id,
      categoryId: input.category_id,
      amount: input.amount
    },
    results: result.results,
    bestCard: result.bestCard
  }
}

/**
 * Format error response
 */
function formatError(error) {
  return {
    success: false,
    error: error.message
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json(formatError(new Error('POST only')))
  }

  try {
    // Parse request body
    const rawBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    
    // Centralized validation using schema
    const validation = validateCalculationRequest(rawBody)
    
    if (!validation.valid) {
      return res.status(400).json(formatError(new Error(validation.errors.join(', '))))
    }
    
    const input = validation.data
    
    // Call calculator domain service
    const result = await calculateBestCardForExpenses(input)
    
    // Check for domain errors
    if (result.error) {
      return res.status(400).json(formatError(new Error(result.error)))
    }
    
    // Return formatted response (camelCase)
    return res.status(200).json(formatResponse(input, result))

  } catch (error) {
    console.error('Calculate API error:', error.message)
    return res.status(500).json(formatError(error))
  }
}
