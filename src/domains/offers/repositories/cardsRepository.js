/**
 * Offers Domain - Cards Repository (for cards lookup)
 * Read-only access to cards
 */

import { getActiveCards, getCardsByIds } from '../../../lib/db'

/**
 * Get all active cards
 * @returns {Promise<Array>} Active cards
 */
export async function findAllCards() {
  return getActiveCards()
}

/**
 * Get specific cards by IDs
 * @param {number[]} cardIds
 * @returns {Promise<Array>}
 */
export async function findCardsByIds(cardIds) {
  if (!cardIds || cardIds.length === 0) return []
  return getCardsByIds(cardIds.map(Number))
}

export default { findAllCards, findCardsByIds }
