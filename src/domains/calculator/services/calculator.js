/**
 * Calculator Domain - Main Calculator Service
 * Orchestrates the calculation of best card for a transaction
 */

import { getActiveCards, getCardsByIds, getRewardRules, getMerchantOffers, saveCalculation } from '../../../lib/db'
import { chooseBestRule, calculateReward, meetsMinSpend } from './ruleEvaluator'
import { estimateOfferValue, filterOffersForCard, calculateTotalOfferValue } from './offerEvaluator'

/**
 * Input shape for calculator
 * @typedef {Object} CalculateInput
 * @property {number} [merchant_id]
 * @property {number} [category_id]
 * @property {number} amount
 * @property {number[]} [card_ids]
 * @property {number} [user_id]
 */

/**
 * Result for a single card
 * @typedef {Object} CardResult
 * @property {number} card_id
 * @property {string} card_name
 * @property {string} bank_name
 * @property {Object} reward_rule
 * @property {Object} base_reward
 * @property {Array} offers
 * @property {number} offer_value
 * @property {number} total_value
 */

/**
 * Calculate best card for a transaction
 * @param {CalculateInput} input
 * @returns {Promise<{results: CardResult[], best_card: CardResult|null}>}
 */
export async function calculateBestCard(input) {
  const { merchant_id, category_id, amount, card_ids, user_id } = input

  // Get cards: use card_ids if provided, otherwise get all active
  let cards
  if (card_ids && Array.isArray(card_ids) && card_ids.length > 0) {
    cards = await getCardsByIds(card_ids.map(Number))
  } else {
    cards = await getActiveCards()
  }

  if (!cards || cards.length === 0) {
    return { results: [], best_card: null, error: 'No cards found' }
  }

  // Get card IDs and bank IDs for queries
  const cardIds = cards.map(c => c.id || c.card_id)
  const bankIds = [...new Set(cards.map(c => c.bank_id).filter(Boolean))]

  // Load reward rules
  const rules = await getRewardRules({
    cardIds,
    merchantId: merchant_id ? Number(merchant_id) : undefined,
    categoryId: category_id ? Number(category_id) : undefined
  })

  // Load offers
  const offers = await getMerchantOffers({
    merchantId: merchant_id ? Number(merchant_id) : undefined,
    cardIds,
    bankIds
  })

  // Calculate for each card
  const results = cards.map(card => {
    const cardId = card.id || card.card_id
    const cardBankId = card.bank_id

    // Get best rule for this card
    const rule = chooseBestRule(rules, cardId)

    // Check min_spend
    if (rule && !meetsMinSpend(rule, amount)) {
      return {
        card_id: cardId,
        card_name: card.card_name || card.name,
        bank_name: card.bank_name,
        reward_rule: null,
        base_reward: { amount: 0, reward_kind: null, effective_rate: null },
        offers: [],
        offer_value: 0,
        total_value: 0
      }
    }

    // Calculate base reward
    const rewardCalc = calculateReward(rule, amount)

    // Find matching offers for this card
    const matchingOffers = filterOffersForCard(offers, cardId, cardBankId)
      .map(offer => ({
        id: offer.id,
        title: offer.title,
        offer_type: offer.offer_type,
        value_type: offer.value_type,
        value: offer.value,
        estimated_value: estimateOfferValue(offer, amount)
      }))
      .filter(o => o.estimated_value > 0)

    const offerValue = matchingOffers.reduce((sum, o) => sum + o.estimated_value, 0)
    const totalValue = rewardCalc.rewardAmount + offerValue

    return {
      card_id: cardId,
      card_name: card.card_name || card.name,
      bank_name: card.bank_name,
      reward_rule: rule ? {
        id: rule.id,
        scope_type: rule.scope_type,
        reward_kind: rule.reward_kind,
        rate_unit: rule.rate_unit,
        rate_value: Number(rule.rate_value)
      } : null,
      base_reward: {
        amount: rewardCalc.rewardAmount,
        reward_kind: rewardCalc.rewardKind,
        effective_rate: rewardCalc.effectiveRate
      },
      offers: matchingOffers,
      offer_value: offerValue,
      total_value: Math.round(totalValue * 100) / 100
    }
  })

  // Sort results: total_value desc, then base_reward.amount desc
  results.sort((a, b) => {
    if (b.total_value !== a.total_value) return b.total_value - a.total_value
    return b.base_reward.amount - a.base_reward.amount
  })

  const bestCard = results[0] || null

  // Save calculation history
  try {
    await saveCalculation({
      user_id: user_id ? Number(user_id) : null,
      input_json: { merchant_id, category_id, amount, card_ids },
      result_json: { results, best_card: bestCard }
    })
  } catch (saveErr) {
    console.warn('Failed to save calculation:', saveErr.message)
  }

  return { results, best_card: bestCard }
}

export default { calculateBestCard }
