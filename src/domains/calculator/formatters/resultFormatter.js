/**
 * Calculator Domain - Result Formatter
 * Output includes explanation-ready fields
 */

/**
 * Format a single card result with placeholders for explanation
 */
export function formatCardResult(card, rule, rewardCalc, offers, offerValue, offerDetails = []) {
  const cardId = card.cardId

  return {
    cardId,
    cardName: card.cardName,
    bankName: card.bankName,
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
    // Applied offers with details (for debugging/explanation)
    appliedOfferIds: offerDetails.map(o => o.id),
    offers: offerDetails.map(o => ({
      id: o.id,
      title: o.title,
      offerType: o.offerType,
      valueType: o.valueType,
      value: o.value,
      stackable: o.stackable,
      estimatedValue: o.estimatedValue
    })),
    offerValue,
    totalValue: Math.round((rewardCalc.rewardAmount + offerValue) * 100) / 100,
    // Placeholder for assumptions/explanation
    assumptions: [
      // Can add reasoning later
    ]
  }
}

/**
 * Sort by total value desc, then by base reward desc
 */
export function sortResults(results) {
  return [...results].sort((a, b) => {
    if (b.totalValue !== a.totalValue) return b.totalValue - a.totalValue
    return b.baseReward.amount - a.baseReward.amount
  })
}

/**
 * Format full calculation response
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
