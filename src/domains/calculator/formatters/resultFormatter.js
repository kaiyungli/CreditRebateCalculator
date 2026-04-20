/**
 * Calculator Domain - Result Formatter
 * Builds final result and breakdown output
 */

/**
 * Format a single card result for output
 * @param {Object} card - Card data from DB
 * @param {Object} rule - Selected reward rule
 * @param {Object} rewardCalc - Calculated reward
 * @param {Array} offers - Matching offers
 * @param {number} offerValue - Total offer value
 * @param {number} amount - Transaction amount
 * @returns {Object} Formatted card result
 */
export function formatCardResult(card, rule, rewardCalc, offers, offerValue, amount) {
  const cardId = card.id || card.card_id
  const cardBankId = card.bank_id

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
    offers: offers,
    offer_value: offerValue,
    total_value: Math.round((rewardCalc.rewardAmount + offerValue) * 100) / 100
  }
}

/**
 * Sort results by total value (desc), then base reward (desc)
 * @param {Array} results 
 * @returns {Array} Sorted results
 */
export function sortResults(results) {
  return [...results].sort((a, b) => {
    if (b.total_value !== a.total_value) return b.total_value - a.total_value
    return b.base_reward.amount - a.base_reward.amount
  })
}

/**
 * Format full calculation response
 * @param {Array} results - Card results
 * @param {Object} bestCard - Best card
 * @returns {Object} Formatted response
 */
export function formatCalculationResponse(results, bestCard) {
  return {
    success: true,
    results,
    best_card: bestCard
  }
}

/**
 * Calculate total value from card result
 * @param {Object} cardResult 
 * @returns {number}
 */
export function getTotalValue(cardResult) {
  return cardResult.total_value || 0
}

export default {
  formatCardResult,
  sortResults,
  formatCalculationResponse,
  getTotalValue
}
