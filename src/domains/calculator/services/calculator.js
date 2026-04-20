/**
 * Calculator Domain - Orchestration Only
 * Coordinates cross-domain decision flow
 */

import { findAllCards, findCardsByIds } from '../../cards/repositories/cardsRepository'
import { findRules } from '../../rewards/repositories/rulesRepository'
import { findOffers } from '../../offers/repositories/offersRepository'
import { chooseBestRule, calculateReward, meetsMinSpend } from '../../rewards/evaluators/ruleEvaluator'
import { estimateOfferValue, filterOffersForCard } from '../../offers/evaluators/offerEvaluator'
import { formatCardResult, sortResults, formatCalculationResponse } from '../formatters/resultFormatter'
import { saveCalculation } from '../../../lib/db'

/**
 * Calculate best card for expenses - orchestration entry point
 * @param {Object} input - { merchant_id, category_id, amount, card_ids, user_id }
 * @returns {Promise<{results: Array, best_card: Object}>}
 */
export async function calculateBestCardForExpenses(input) {
  const { merchant_id, category_id, amount, card_ids, user_id } = input

  // ===== LAYER 1: Get Cards (from cards domain) =====
  let cards
  if (card_ids && Array.isArray(card_ids) && card_ids.length > 0) {
    cards = await findCardsByIds(card_ids)
  } else {
    cards = await findAllCards()
  }

  if (!cards || cards.length === 0) {
    return { results: [], best_card: null, error: 'No cards found' }
  }

  // ===== LAYER 2: Get Data from Repositories =====
  const cardIds = cards.map(c => c.id || c.card_id)
  const bankIds = [...new Set(cards.map(c => c.bank_id).filter(Boolean))]

  // Rewards: read rules only (rewards domain)
  const rules = await findRules({
    cardIds,
    merchantId: merchant_id ? Number(merchant_id) : undefined,
    categoryId: category_id ? Number(category_id) : undefined
  })

  // Offers: read offers only (offers domain)
  const offers = await findOffers({
    merchantId: merchant_id ? Number(merchant_id) : undefined,
    cardIds,
    bankIds
  })

  // ===== LAYER 3: Call Evaluators (owned by respective domains) =====
  const results = cards.map(card => {
    const cardId = card.id || card.card_id
    const cardBankId = card.bank_id

    // Rewards domain: evaluate reward
    const rule = chooseBestRule(rules, cardId)
    if (rule && !meetsMinSpend(rule, amount)) {
      return formatCardResult(card, null, { rewardAmount: 0, rewardKind: null, effectiveRate: null }, [], 0, amount)
    }
    const rewardCalc = calculateReward(rule, amount)

    // Offers domain: evaluate offers
    const cardOffers = filterOffersForCard(offers, cardId, cardBankId)
    const matchingOffers = cardOffers.map(offer => ({
      id: offer.id,
      title: offer.title,
      offer_type: offer.offer_type,
      value_type: offer.value_type,
      value: offer.value,
      estimated_value: estimateOfferValue(offer, amount)
    })).filter(o => o.estimated_value > 0)

    const offerValue = matchingOffers.reduce((sum, o) => sum + o.estimated_value, 0)
    return formatCardResult(card, rule, rewardCalc, matchingOffers, offerValue, amount)
  })

  // ===== LAYER 4: Formatter =====
  const sortedResults = sortResults(results)
  const bestCard = sortedResults[0] || null

  // Save history
  try {
    await saveCalculation({
      user_id: user_id ? Number(user_id) : null,
      input_json: { merchant_id, category_id, amount, card_ids },
      result_json: { results: sortedResults, best_card: bestCard }
    })
  } catch (saveErr) {
    console.warn('Failed to save calculation:', saveErr.message)
  }

  return formatCalculationResponse(sortedResults, bestCard)
}

export const calculateBestCard = calculateBestCardForExpenses
export default { calculateBestCardForExpenses, calculateBestCard }
