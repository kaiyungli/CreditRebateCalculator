/**
 * Calculator Domain - Orchestration Only
 * Uses shared schemas for validation
 */

import { findAllCards, findCardsByIds } from '../../cards/repositories/cardsRepository'
import { findRules } from '../../rewards/repositories/rulesRepository'
import { findOffers } from '../../offers/repositories/offersRepository'
import { chooseBestRule, calculateReward, meetsMinSpend } from '../../rewards/evaluators/ruleEvaluator'
import { estimateOfferValue, filterOffersForCard } from '../../offers/evaluators/offerEvaluator'
import { formatCardResult, sortResults, formatCalculationResponse } from '../formatters/resultFormatter'
import { saveCalculation } from '../../../lib/db'

/**
 * Calculate best card for expenses
 * @param {Object} input - CalculationRequest from schema
 * @returns {Promise<{results: Array, best_card: Object}>}
 */
export async function calculateBestCardForExpenses(input) {
  const { merchant_id, category_id, amount, card_ids, user_id } = input

  // Layer 1: Get Cards
  let cards
  if (card_ids && Array.isArray(card_ids) && card_ids.length > 0) {
    cards = await findCardsByIds(card_ids)
  } else {
    cards = await findAllCards()
  }

  if (!cards || cards.length === 0) {
    return { results: [], best_card: null, error: 'No cards found' }
  }

  // Layer 2: Get Data from Repositories
  const cardIds = cards.map(c => c.id || c.card_id)
  const bankIds = [...new Set(cards.map(c => c.bank_id).filter(Boolean))]

  const rules = await findRules({
    cardIds,
    merchantId: merchant_id,
    categoryId: category_id
  })

  const offers = await findOffers({
    merchantId: merchant_id,
    cardIds,
    bankIds
  })

  // Layer 3: Call Evaluators
  const results = cards.map(card => {
    const cardId = card.id || card.card_id
    const cardBankId = card.bank_id

    const rule = chooseBestRule(rules, cardId)
    if (rule && !meetsMinSpend(rule, amount)) {
      return formatCardResult(card, null, { rewardAmount: 0, rewardKind: null, effectiveRate: null }, [], 0)
    }

    const rewardCalc = calculateReward(rule, amount)

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

    return formatCardResult(card, rule, rewardCalc, matchingOffers, offerValue)
  })

  // Layer 4: Formatter
  const sortedResults = sortResults(results)
  const bestCard = sortedResults[0] || null

  // Save history
  try {
    await saveCalculation({
      user_id,
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
