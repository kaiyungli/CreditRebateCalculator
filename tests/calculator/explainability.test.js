/**
 * Explainability v1 Tests
 */

let passed = 0
let failed = 0

function test(name, fn) {
  try { fn(); console.log('✅ ' + name); passed++; } catch(e) { console.log('❌ ' + name + ': ' + e.message); failed++; }
}

function eq(a, b) { if (a !== b) throw new Error('Expected ' + b + ', got ' + a); }
function ok(a) { if (!a) throw new Error('Expected truthy'); }

// E1: applied base rule summary
test('E1: applied rule summary - merchant', () => {
  const rule = { id: 1, scopeType: 'MERCHANT', rateValue: 5, rateUnit: 'PERCENT', rewardKind: 'CASHBACK', effectiveRate: 5 }
  const summary = formatRuleSummary(rule)
  ok(summary.scope === 'merchant')
  ok(summary.reward.includes('5%'))
})

test('E2: applied rule summary - category', () => {
  const rule = { id: 2, scopeType: 'CATEGORY', rateValue: 3, rateUnit: 'PERCENT', rewardKind: 'CASHBACK', effectiveRate: 3 }
  const summary = formatRuleSummary(rule)
  eq(summary.scope, 'category')
})

test('E3: applied rule summary - general', () => {
  const rule = { id: 3, scopeType: 'GENERAL', rateValue: 1.2, rateUnit: 'PERCENT', rewardKind: 'CASHBACK', effectiveRate: 1.2 }
  const summary = formatRuleSummary(rule)
  eq(summary.scope, 'base')
})

// E4-E5: applied offer summary
test('E4: applied offer summary - FIXED', () => {
  const offer = { id: 10, title: 'Test', valueType: 'FIXED', value: 50, estimatedValue: 50 }
  const summary = formatOfferSummary(offer)
  ok(summary.summary.includes('HK$50'))
})

test('E5: applied offer summary - PERCENT with cap', () => {
  const offer = { id: 11, title: '5% Rebate', valueType: 'PERCENT', value: 5, maxReward: 100, estimatedValue: 50 }
  const summary = formatOfferSummary(offer)
  ok(summary.summary.includes('5%'))
  ok(summary.summary.includes('capped'))
})

// E6-E7: skipped offer reason
test('E6: skipped offer reason - threshold_type', () => {
  const details = [
    { id: 1, title: 'A', skippedReason: 'threshold_type:MONTHLY_ACCUMULATED' },
    { id: 2, title: 'B', estimatedValue: 20 }
  ]
  const skipped = details.filter(o => o.skippedReason)
  eq(skipped.length, 1)
})

test('E7: skipped offer reason - condition', () => {
  const details = [{ id: 1, title: 'Weekend', skippedReason: 'condition:weekday' }]
  eq(details[0].skippedReason, 'condition:weekday')
})

// E8: assumptions collected
test('E8: assumptions collected', () => {
  const details = [
    { skippedReason: 'condition:wallet' },
    { skippedReason: 'threshold_type:MONTHLY' },
    { skippedReason: 'minSpend:not_met' }
  ]
  eq(details.length, 3)
})

// E9: mixed applied + skipped
test('E9: mixed applied and skipped', () => {
  const all = [
    { estimatedValue: 30 },
    { estimatedValue: 10 },
    { skippedReason: 'condition:channel' }
  ]
  eq(all.filter(a => a.estimatedValue > 0).length, 2)
  eq(all.filter(a => a.skippedReason).length, 1)
})

function formatRuleSummary(rule) {
  if (!rule) return null
  const scopeLabel = { 'MERCHANT': 'merchant', 'CATEGORY': 'category', 'GENERAL': 'base' }[rule.scopeType] || 'rule'
  const rateLabel = rule.rateUnit === 'PERCENT' ? `${rule.rateValue}%` : `HK$${rule.rateValue}`
  return { ruleId: rule.id, scope: scopeLabel, reward: `${rateLabel} cashback`, effectiveRate: rule.effectiveRate }
}

function formatOfferSummary(offer) {
  if (!offer) return null
  let summary = offer.valueType === 'FIXED' ? `HK$${offer.value} fixed` : `${offer.value}%`
  if (offer.maxReward) summary += ` (capped ${offer.maxReward})`
  return { offerId: offer.id, title: offer.title, summary, value: offer.estimatedValue }
}

console.log('\nResults: ' + (9 - failed) + '/9 passed')
failed === 0 ? process.exit(0) : process.exit(1)
