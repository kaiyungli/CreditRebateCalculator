/**
 * Calculator Domain - Orchestration Only
 * Uses normalized domain objects (camelCase)
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
 */
export async function calculateBestCardForExpenses(input) {
  const { merchant_id, category_id, amount, card_ids, user_id } = input

  // Layer 1: Get Cards (normalized: cardId, cardName, bankId)
  let cards
  if (card_ids && Array.isArray(card_ids) && card_ids.length > 0) {
    cards = await findCardsByIds(card_ids)
  } else {
    cards = await findAllCards()
  }

  if (!cards || cards.length === 0) {
    return { results: [], bestCard: null, error: 'No cards found' }
  }

  // Build IDs from normalized card objects
  const cardIds = cards.map(c => c.cardId)
  const bankIds = [...new Set(cards.map(c => c.bankId).filter(Boolean))]

  // Layer 2: Get normalized data from repositories
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

  // Layer 3: Evaluators (using camelCase)
  const results = cards.map(card => {
    const cardId = card.cardId
    const cardBankId = card.bankId

    const rule = chooseBestRule(rules, cardId)
    if (rule && !meetsMinSpend(rule, amount)) {
      return formatCardResult(card, null, { rewardAmount: 0, rewardKind: null, effectiveRate: null }, [], 0)
    }

    const rewardCalc = calculateReward(rule, amount)

    const cardOffers = filterOffersForCard(offers, cardId, cardBankId)
    const matchingOffers = cardOffers.map(offer => ({
      id: offer.id,
      title: offer.title,
      offerType: offer.offerType,
      valueType: offer.valueType,
      value: offer.value,
      estimatedValue: estimateOfferValue(offer, amount)
    })).filter(o => o.estimatedValue > 0)

    const offerValue = matchingOffers.reduce((sum, o) => sum + o.estimatedValue, 0)

    return formatCardResult(card, rule, rewardCalc, matchingOffers, offerValue)
  })

  // Layer 4: Formatter
  const sortedResults = sortResults(results)
  const bestCard = sortedResults[0] || null

  // Save history (using normalized input)
  try {
    await saveCalculation({
      user_id,
      input_json: { merchant_id, category_id, amount, card_ids },
      result_json: { results: sortedResults, bestCard }
    })
  } catch (saveErr) {
    console.warn('Failed to save calculation:', saveErr.message)
  }

  return formatCalculationResponse(sortedResults, bestCard)
}

export const calculateBestCard = calculateBestCardForExpenses
export default { calculateBestCardForExpenses, calculateBestCard }
