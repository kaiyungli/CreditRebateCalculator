/**
 * Cards Domain - Cards Repository
 * Robust runtime handling
 */

import { getActiveCards as getRawCards, getCardsByIds as getRawCardsByIds } from '../../../lib/db'

/**
 * Safely normalize card
 */
function normalizeCard(card) {
  if (!card) return null
  
  return {
    id: card.id || 0,
    cardId: card.cardId || card.id || 0,
    cardName: card.cardName || card.name || 'Unknown Card',
    bankId: card.bankId || card.bank_id || 0,
    bankName: card.bankName || card.bank_name || 'Unknown Bank',
    rewardProgram: card.rewardProgram || card.reward_program || null,
    network: card.network || 'VISA',
    annualFee: card.annualFee || card.annual_fee || 0,
    imageUrl: card.imageUrl || card.image_url || null,
    applyUrl: card.applyUrl || card.apply_url || null
  }
}

/**
 * Get all active cards - safe
 */
export async function findAllCards() {
  try {
    const rawCards = await getRawCards()
    if (!rawCards || !Array.isArray(rawCards)) return []
    return rawCards.map(normalizeCard).filter(Boolean)
  } catch (e) {
    console.error('Error fetching cards:', e.message)
    return []
  }
}

/**
 * Get cards by IDs - safe
 */
export async function findCardsByIds(cardIds) {
  if (!cardIds || !Array.isArray(cardIds) || cardIds.length === 0) return []
  
  try {
    const rawCards = await getRawCardsByIds(cardIds)
    if (!rawCards || !Array.isArray(rawCards)) return []
    return rawCards.map(normalizeCard).filter(Boolean)
  } catch (e) {
    console.error('Error fetching cards by IDs:', e.message)
    return []
  }
}

export default { findAllCards, findCardsByIds }
