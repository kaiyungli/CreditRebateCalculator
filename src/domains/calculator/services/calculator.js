/**
 * Calculator Domain - Input Resolution
 * merchant-first precedence with category fallback
 */

import { findAllCards, findCardsByIds } from '../../cards/repositories/cardsRepository'
import { findRules } from '../../rewards/repositories/rulesRepository'
import { findOffers } from '../../offers/repositories/offersRepository'
import { findMerchantCategory } from '../../offers/repositories/merchantsRepository'
import { chooseBestRule, calculateReward, meetsMinSpend } from '../../rewards/evaluators/ruleEvaluator'
import { estimateOfferValue, filterOffersForCard, getApplicableOffersWithDetails, calculateTotalOfferValue, validateOffer } from '../../offers/evaluators/offerEvaluator'
import { formatCardResult, sortResults, formatCalculationResponse } from '../formatters/resultFormatter'
import { saveCalculation } from '../../../lib/db'

/**
 * Normalize input:
 * - merchant takes precedence
 * - if merchant exists but category missing, try to use merchant's category
 * - track assumptions for resolution
 */
function normalizeInput(input) {
  const { merchant_id, category_id } = input
  
  let effectiveMerchantId = merchant_id ? Number(merchant_id) : null
  let effectiveCategoryId = category_id ? Number(category_id) : null
  const assumptions = []
  
  // Rule 1: merchant takes precedence
  if (effectiveMerchantId) {
    // Check if category also provided
    if (category_id && effectiveCategoryId) {
      // Both provided - will use merchant but note the potential conflict
      assumptions.push('input:merchantOverwritesCategory')
    }
    // merchant alone is fine - category can be derived if needed
  } else if (effectiveCategoryId) {
    // Category only - this is fine
    assumptions.push('input:categoryOnly')
  } else {
    // Neither provided - this shouldn't happen (validated upstream)
    assumptions.push('input:missing')
  }
  
  return {
    effectiveMerchantId,
    effectiveCategoryId,
    assumptions
  }
}

/**
 * Get effective IDs using merchant category derivation
 */
async function resolveEffectiveIds(input) {
  const normalized = normalizeInput(input)
  
  let { effectiveMerchantId, effectiveCategoryId, assumptions } = normalized
  
  // If merchant exists, try to derive category from merchant
  if (effectiveMerchantId && !effectiveCategoryId) {
    try {
      const merchant = await findMerchantCategory(effectiveMerchantId)
      if (merchant && merchant.categoryId) {
        effectiveCategoryId = merchant.categoryId
        assumptions.push('input:derivedCategoryFromMerchant')
      }
    } catch (e) {
      // Merchant lookup failed - continue without derived category
      assumptions.push('input:merchantDerivationFailed')
    }
  }
  
  return {
    effectiveMerchantId,
    effectiveCategoryId,
    inputAssumptions: assumptions
  }
}

/**
 * Calculate best card for expenses
 */
export async function calculateBestCardForExpenses(input) {
  const { amount, card_ids, user_id, channel, wallet, weekday } = input
  
  // Resolve effective merchant/category IDs
  const { effectiveMerchantId, effectiveCategoryId, inputAssumptions } = await resolveEffectiveIds(input)
  
  let cards
  if (card_ids && Array.isArray(card_ids) && card_ids.length > 0) {
    cards = await findCardsByIds(card_ids)
  } else {
    cards = await findAllCards()
  }

  if (!cards || cards.length === 0) {
    return { 
      results: [], 
      bestCard: null, 
      error: 'No cards found',
      inputMetadata: { effectiveMerchantId, effectiveCategoryId, inputAssumptions }
    }
  }

  const cardIds = cards.map(c => c.cardId)
  const bankIds = [...new Set(cards.map(c => c.bankId).filter(Boolean))]

  const rules = await findRules({
    cardIds,
    merchantId: effectiveMerchantId,
    categoryId: effectiveCategoryId
  })

  const offers = await findOffers({
    merchantId: effectiveMerchantId,
    cardIds,
    bankIds
  })

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
    const skippedOffers = allOfferDetails.filter(o => o.skippedReason)
    
    const offerValue = calculateTotalOfferValue(cardOffers, amount, conditionInput)

    return formatCardResult(card, rule, rewardCalc, appliedOffers, offerValue, allOfferDetails, skippedOffers)
  })

  const sortedResults = sortResults(results)
  const bestCard = sortedResults[0] || null

  // Save with input metadata
  try {
    await saveCalculation({
      user_id,
      input_json: { 
        merchant_id: input.merchant_id, 
        category_id: input.category_id,
        amount, 
        card_ids,
        effectiveMerchantId,
        effectiveCategoryId,
        channel,
        wallet,
        weekday
      },
      result_json: { results: sortedResults, bestCard }
    })
  } catch (saveErr) {
    console.warn('Failed to save calculation:', saveErr.message)
  }

  // Add input metadata to response
  const response = formatCalculationResponse(sortedResults, bestCard)
  response.inputMetadata = { effectiveMerchantId, effectiveCategoryId, inputAssumptions }
  
  return response
}

export const calculateBestCard = calculateBestCardForExpenses
export default { calculateBestCardForExpenses, calculateBestCard }
