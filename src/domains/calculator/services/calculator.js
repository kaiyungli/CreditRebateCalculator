/**
 * Calculator Domain - Orchestration Only
 * Uses stackable v1 offer logic
 */

import { findAllCards, findCardsByIds } from '../../cards/repositories/cardsRepository'
import { findRules } from '../../rewards/repositories/rulesRepository'
import { findOffers } from '../../offers/repositories/offersRepository'
import { chooseBestRule, calculateReward, meetsMinSpend } from '../../rewards/evaluators/ruleEvaluator'
import { estimateOfferValue, filterOffersForCard, getApplicableOffersWithDetails, calculateTotalOfferValue } from '../../offers/evaluators/offerEvaluator'
import { formatCardResult, sortResults, formatCalculationResponse } from '../formatters/resultFormatter'
import { saveCalculation } from '../../../lib/db'

/**
 * Calculate best card for expenses
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
    return { results: [], bestCard: null, error: 'No cards found' }
  }

  const cardIds = cards.map(c => c.cardId)
  const bankIds = [...new Set(cards.map(c => c.bankId).filter(Boolean))]

  // Layer 2: Get normalized data
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

  // Layer 3: Evaluators with stackable logic
  const results = cards.map(card => {
    const cardId = card.cardId
    const cardBankId = card.bankId

    const rule = chooseBestRule(rules, cardId)
    if (rule && !meetsMinSpend(rule, amount)) {
      return formatCardResult(card, null, { rewardAmount: 0, rewardKind: null, effectiveRate: null }, [], 0)
    }

    const rewardCalc = calculateReward(rule, amount)

    // Filter offers for this card
    const cardOffers = filterOffersForCard(offers, cardId, cardBankId)
    
    // Get offer details with stackable info
    const offerDetails = getApplicableOffersWithDetails(cardOffers, amount)
    
    // Calculate total using stackable v1 logic
    const offerValue = calculateTotalOfferValue(cardOffers, amount)

    return formatCardResult(card, rule, rewardCalc, offerDetails, offerValue, offerDetails)
  })

  // Layer 4: Formatter
  const sortedResults = sortResults(results)
  const bestCard = sortedResults[0] || null

  // Save history
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
