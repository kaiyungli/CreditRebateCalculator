/**
 * Cards Domain - Cards Repository
 * Normalized access to cards
 */

import { getActiveCards as getRawCards, getCardsByIds as getRawCardsByIds } from '../../../lib/db'

/**
 * Normalize raw card to camelCase
 */
function normalizeCard(card) {
  if (!card) return null
  return {
    id: card.id,
    cardId: card.card_id || card.id,
    cardName: card.card_name || card.name,
    bankId: card.bank_id,
    bankName: card.bank_name,
    rewardProgram: card.reward_program,
    network: card.network || 'VISA',
    annualFee: card.annual_fee,
    imageUrl: card.image_url,
    applyUrl: card.apply_url
  }
}

/**
 * Get all active cards
 */
export async function findAllCards() {
  const rawCards = await getRawCards()
  return rawCards.map(normalizeCard)
}

/**
 * Get specific cards by IDs
 */
export async function findCardsByIds(cardIds) {
  if (!cardIds || cardIds.length === 0) return []
  const rawCards = await getRawCardsByIds(cardIds)
  return rawCards.map(normalizeCard)
}

export default { findAllCards, findCardsByIds }
