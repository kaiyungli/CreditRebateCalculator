/**
 * Calculator Domain - Orchestration Only
 * Uses conditions_json v1
 */

import { findAllCards, findCardsByIds } from '../../cards/repositories/cardsRepository'
import { findRules } from '../../rewards/repositories/rulesRepository'
import { findOffers } from '../../offers/repositories/offersRepository'
import { chooseBestRule, calculateReward, meetsMinSpend } from '../../rewards/evaluators/ruleEvaluator'
import { estimateOfferValue, filterOffersForCard, getApplicableOffersWithDetails, calculateTotalOfferValue, isThresholdTypeSupported, evaluateConditions } from '../../offers/evaluators/offerEvaluator'
import { formatCardResult, sortResults, formatCalculationResponse } from '../formatters/resultFormatter'
import { saveCalculation } from '../../../lib/db'

/**
 * Calculate best card for expenses
 */
export async function calculateBestCardForExpenses(input) {
  const { merchant_id, category_id, amount, card_ids, user_id, channel, wallet, weekday } = input

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

  // Condition input for evaluation
  const conditionInput = { channel, wallet, weekday }

  const results = cards.map(card => {
    const cardId = card.cardId
    const cardBankId = card.bankId

    const rule = chooseBestRule(rules, cardId)
    if (rule && !meetsMinSpend(rule, amount)) {
      return formatCardResult(card, null, { rewardAmount: 0, rewardKind: null, effectiveRate: null }, [], 0)
    }

    const rewardCalc = calculateReward(rule, amount)

    const cardOffers = filterOffersForCard(offers, cardId, cardBankId)
    const allOfferDetails = getApplicableOffersWithDetails(cardOffers, amount, conditionInput)
    const appliedOffers = allOfferDetails.filter(o => o.estimatedValue > 0)
    const skippedOffers = allOfferDetails.filter(o => o.skippedReason).map(o => o.skippedReason)
    
    const offerValue = calculateTotalOfferValue(cardOffers, amount, conditionInput)

    return formatCardResult(card, rule, rewardCalc, appliedOffers, offerValue, appliedOffers, skippedOffers)
  })

  const sortedResults = sortResults(results)
  const bestCard = sortedResults[0] || null

  try {
    await saveCalculation({
      user_id,
      input_json: { merchant_id, category_id, amount, card_ids, channel, wallet, weekday },
      result_json: { results: sortedResults, bestCard }
    })
  } catch (saveErr) {
    console.warn('Failed to save calculation:', saveErr.message)
  }

  return formatCalculationResponse(sortedResults, bestCard)
}

export const calculateBestCard = calculateBestCardForExpenses
export default { calculateBestCardForExpenses, calculateBestCard }
