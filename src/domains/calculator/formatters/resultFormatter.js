/**
 * Calculator Domain - Result Formatter
 * Outputs normalized camelCase response
 */

/**
 * Format a single card result
 * Input: normalized domain objects (camelCase)
 * Output: normalized response (camelCase)
 */
export function formatCardResult(card, rule, rewardCalc, offers, offerValue) {
  const cardId = card.id || card.card_id

  return {
    cardId,
    cardName: card.card_name || card.name,
    bankName: card.bank_name,
    rewardRule: rule ? {
      id: rule.id,
      scopeType: rule.scopeType,
      rewardKind: rule.rewardKind,
      rateUnit: rule.rateUnit,
      rateValue: Number(rule.rateValue)
    } : null,
    baseReward: {
      amount: rewardCalc.rewardAmount,
      rewardKind: rewardCalc.rewardKind,
      effectiveRate: rewardCalc.effectiveRate
    },
    offers: offers,
    offerValue,
    totalValue: Math.round((rewardCalc.rewardAmount + offerValue) * 100) / 100
  }
}

/**
 * Sort by total value desc, then base reward desc
 */
export function sortResults(results) {
  return [...results].sort((a, b) => {
    if (b.totalValue !== a.totalValue) return b.totalValue - a.totalValue
    return b.baseReward.amount - a.baseReward.amount
  })
}

/**
 * Format full response
 */
export function formatCalculationResponse(results, bestCard) {
  return {
    success: true,
    results,
    bestCard
  }
}

export default {
  formatCardResult,
  sortResults,
  formatCalculationResponse
}
