/**
 * Calculator Domain - Robust Input Resolution
 * Handles unknown/partial merchant/category cases
 */

import { findAllCards, findCardsByIds } from '../../cards/repositories/cardsRepository'
import { findRules } from '../../rewards/repositories/rulesRepository'
import { findOffers } from '../../offers/repositories/offersRepository'
import { findMerchantWithCategory } from '../../offers/repositories/merchantsRepository'
import { chooseBestRule, calculateReward, meetsMinSpend } from '../../rewards/evaluators/ruleEvaluator'
import { estimateOfferValue, filterOffersForCard, getApplicableOffersWithDetails, calculateTotalOfferValue } from '../../offers/evaluators/offerEvaluator'
import { formatCardResult, sortResults, formatCalculationResponse } from '../formatters/resultFormatter'
import { saveCalculation } from '../../../lib/db'

/**
 * Resolve input with unknown/partial handling
 */
async function resolveEffectiveIds(input) {
  const { merchant_id, category_id } = input
  
  let effectiveMerchantId = null
  let effectiveCategoryId = null
  let assumptions = []
  
  // Normalize to numbers first
  const inputMerchantId = merchant_id ? Number(merchant_id) : null
  const inputCategoryId = category_id ? Number(category_id) : null
  
  // Case 1: merchant provided
  if (inputMerchantId) {
    try {
      // Try to find merchant with its category
      const merchant = await findMerchantWithCategory(inputMerchantId)
      
      if (merchant && merchant.exists) {
        // Known merchant
        effectiveMerchantId = inputMerchantId
        
        // If category also provided, validate both
        if (inputCategoryId) {
          effectiveCategoryId = inputCategoryId
          if (merchant.categoryId && merchant.categoryId !== inputCategoryId) {
            assumptions.push('input:categoryMayOverride')
          }
        } else if (merchant.categoryId) {
          // Derive category from merchant
          effectiveCategoryId = merchant.categoryId
          assumptions.push('input:categoryDerivedFromMerchant')
        } else {
          // Merchant has no category - need explicit category
          assumptions.push('input:merchantHasNoCategory')
        }
      } else {
        // Unknown merchant - but if category is provided, use it
        assumptions.push('input:unknownMerchant')
        if (inputCategoryId) {
          effectiveCategoryId = inputCategoryId
          assumptions.push('input:usingCategoryAsFallback')
        } else {
          assumptions.push('input:missingMerchantAndCategory')
        }
      }
    } catch (e) {
      // Merchant lookup failed - try category if provided
      assumptions.push('input:merchantLookupFailed')
      if (inputCategoryId) {
        effectiveCategoryId = inputCategoryId
        assumptions.push('input:usingCategoryAsFallback')
      }
    }
  } 
  // Case 2: category only
  else if (inputCategoryId) {
    effectiveCategoryId = inputCategoryId
    assumptions.push('input:categoryOnly')
  } 
  // Case 3: neither provided
  else {
    assumptions.push('input:missingMerchantAndCategory')
  }
  
  return {
    effectiveMerchantId,
    effectiveCategoryId,
    inputAssumptions: assumptions
  }
}

/**
 * Calculate best card
 */
export async function calculateBestCardForExpenses(input) {
  const { amount, card_ids, user_id, channel, wallet, weekday } = input
  
  // Resolve effective IDs with robust unknown handling
  const { effectiveMerchantId, effectiveCategoryId, inputAssumptions } = await resolveEffectiveIds(input)
  
  // Check if we have valid input
  if (!effectiveMerchantId && !effectiveCategoryId) {
    return { 
      results: [], 
      bestCard: null, 
      error: 'merchant_id or category_id required',
      inputMetadata: { effectiveMerchantId: null, effectiveCategoryId: null, inputAssumptions }
    }
  }
  
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

  const response = formatCalculationResponse(sortedResults, bestCard)
  response.inputMetadata = { effectiveMerchantId, effectiveCategoryId, inputAssumptions }
  
  return response
}

export const calculateBestCard = calculateBestCardForExpenses
export default { calculateBestCardForExpenses, calculateBestCard }
