# Decision Rules - Credit Rebate Calculator

## Overview

This document describes the decision logic for selecting the best credit card for a transaction.

---

## 1. Base Reward Resolution

### Scope Hierarchy
```
MERCHANT > CATEGORY > GENERAL
```
- **MERCHANT**: Rule tied to specific merchant_id (highest priority)
- **CATEGORY**: Rule tied to specific category_id
- **GENERAL**: Rule with no merchant_id or category_id (lowest priority)

### Resolution Logic (chooseBestRule)
```
For each card:
  1. Find rules matching card_id
  2. Pick highest-priority matching rule:
     - If merchant_id exists → MERCHANT scope
     - Else if category_id exists → CATEGORY scope  
     - Else → GENERAL scope
```

### Rule Selection Criteria
- Must be ACTIVE status
- valid_from NULL or <= today (NULL = always valid)
- valid_to NULL or >= today (NULL = never expires)
- min_spend: If set, amount must >= min_spend

### Priority Resolution
Same-scope rules: resolved by `priority` field (lower = higher priority)

---

## 2. Offer Resolution

### Matching Logic
```
For each offer:
  1. Must be ACTIVE status
  2. is_active must NOT be false
  3. start_date NULL or <= today
  4. end_date NULL or >= today
  5. min_spend: amount must >= min_spend (if set)
```

### Card/Bank Matching
- `card_id = NULL` → applies to all cards
- `card_id = X` → applies only to card X
- `bank_id = NULL` → applies to all banks  
- `bank_id = Y` → applies only to bank Y

**Priority:** Card-specific > Bank-level > No restriction

---

## 3. Combined Decision

### Per-Card Calculation
```
For each card:
  1. Evaluate base reward (apply min_spend check)
  2. Evaluate matching offers
  3. Sum: totalValue = baseReward + offerValue
```

### Card Selection
```
1. Calculate totalValue for each card
2. Sort by totalValue DESC
3. If tie, sort by baseReward DESC
4. Return best card
```

---

## 4. Supported Fields

### reward_rules Table
| Field | Status | Notes |
|-------|-------|-------|
| card_id | ✅ Used | Required |
| merchant_id | ✅ Used | Scope selection |
| category_id | ✅ Used | Scope selection |
| reward_kind | ✅ Used | CASHBACK/POINTS/MILES |
| rate_unit | ✅ Used | PERCENT/FIXED/PER_AMOUNT |
| rate_value | ✅ Used | The reward value |
| per_amount | ⚠️ PARIAL | PER_AMOUNT calculation |
| cap_value | ✅ Used | Monthly cap |
| min_spend | ✅ Used | Minimum spend |
| priority | ✅ Used | Tie-breaker |
| valid_from | ✅ Used | Date validity |
| valid_to | ✅ Used | Date validity |
| **threshold_type** | ❌ NOT USED | Exists in schema |
| **conditions_json** | ❌ NOT USED | Exists in schema |

### merchant_offers Table
| Field | Status | Notes |
|-------|-------|-------|
| merchant_id | ✅ Used | Offer targeting |
| bank_id | ✅ Used | Bank-level offer |
| card_id | ✅ Used | Card-specific offer |
| value_type | ✅ Used | FIXED/PERCENT |
| value | ✅ Used | The value |
| min_spend | ✅ Used | Minimum spend |
| max_reward | ✅ Used | Cap on reward |
| start_date | ✅ Used | Date validity |
| end_date | ✅ Used | Date validity |
| **offer_type** | ⚠️ PARTIAL | Saved but not used in logic |
| **description** | ❌ NOT USED | Saved but not used |
| **source** | ❌ NOT USED | Traceability field |
| **is_verified** | ❌ NOT USED | Verification flag |
| **stackable** | ❌ NOT USED | Exists but not used |

---

## 5. Unsupported / Partial Features

### threshold_type
- **Status:** NOT IMPLEMENTED
- **Exists in:** reward_rules table
- **Behavior:** Not checked in calculation

### conditions_json
- **Status:** NOT IMPLEMENTED  
- **Exists in:** reward_rules table
- **Behavior:** Not evaluated

### stackable
- **Status:** NOT IMPLEMENTED
- **Exists in:** merchant_offers table
- **Behavior:** All applicable offers are summed (assumes non-stackable by additive logic)

---

## 6. Calculation Formulas

### Base Reward
```js
// PERCENT
rewardAmount = amount * rateValue / 100

// FIXED
rewardAmount = rateValue

// PER_AMOUNT  
rewardAmount = Math.floor(amount / perAmount) * rateValue

// With cap
rewardAmount = Math.min(rewardAmount, capValue)
```

### Offer Value
```js
// FIXED
value = Math.min(value, maxReward)

// PERCENT
value = Math.min(amount * value / 100, maxReward)

// With min_spend check
if (amount < minSpend) value = 0
```

---

## 7. Null/Edge Cases

| Scenario | Behavior |
|----------|----------|
| No rules for card | zero reward |
| Rule expired | ignored |
| Rule not started | ignored |
| No matching offer | zero offer value |
| Offer expires | ignored |
| minSpend not met | offer ignored |
| No cards found | error returned |

---

## 8. Test Coverage Summary

| Category | Test Cases |
|----------|----------|
| Base Reward Selection | 6 |
| Offer Selection | 6 |
| Combined Decision | 3 |
| Total | 15+ |

---

## Stackable v1 Behavior

### Logic
```
If ALL applicable offers are stackable=true → sum them
If ANY non-stackable offer exists → pick highest-value non-stackable only
Do NOT mix stackable + non-stackable offers in v1
```

### Implementation
- `offersRepository`: maps `stackable` field from DB
- `offerEvaluator.calculateTotalOfferValue()`: implements v1 logic
- `resultFormatter`: includes `appliedOfferIds`, `offers[].stackable`, `assumptions[]`

### Tests
- Multiple stackable → sum: ✅
- Single non-stackable → apply: ✅
- Two non-stackable → highest: ✅
- Mixed → non-stackable only: ✅
- No offers → zero: ✅

---

## Stackable Status

| Feature | Status | Notes |
|---------|--------|-------|
| stackable | ✅ Support | v1 implemented |
| threshold_type | ❌ NOT USED | Exists in schema |
| conditions_json | ❌ NOT USED | Exists in schema |

---

## threshold_type v1 Behavior

### Supported
- **PER_TXN**: Default, applies per transaction (fully supported)

### Not Yet Supported
- **MONTHLY_ACCUMULATED**: Returns 0, logs assumption "offerSkipped:threshold_type:MONTHLY_ACCUMULATED"
- **CAMPAIGN_ACCUMULATED**: Returns 0, logs assumption "offerSkipped:threshold_type:CAMPAIGN_ACCUMULATED"

### Implementation
- `offersRepository`: maps `threshold_type` field
- `offerEvaluator.isThresholdTypeSupported()`: checks support
- `offerEvaluator.getApplicableOffersWithDetails()`: tracks skipped reasons
- `resultFormatter`: includes assumptions array

### Default Behavior
- If `thresholdType` is NULL/undefined → treat as PER_TXN
- If unsupported type → return 0 value, add to assumptions

---

## threshold_type Status

| Feature | Status | Notes |
|---------|--------|-------|
| threshold_type=PER_TXN | ✅ Supported | v1 implemented |
| threshold_type=MONTHLY_ACCUMULATED | ❌ Skipped | Needs monthly tracking |
| threshold_type=CAMPAIGN_ACCUMULATED | ❌ Skipped | Needs campaign tracking |

---

## conditions_json v1 Behavior (Whitelist)

### Supported Keys
- **channel**: 'online', 'in_store', 'app', 'all'
- **wallet**: 'apple_pay', 'google_pay', 'samsung_pay', 'visa_pay', 'all'
- **weekday**: 'monday'..'sunday', 'all'

### Evaluation
- Condition satisfied → apply offer
- Condition not met → offer returns 0, add reason
- Missing required input → offer returns 0, add assumption
- Unknown key → ignore + record assumption

### Assumptions
- `condition:channel` - channel mismatch
- `condition:wallet` - wallet mismatch
- `condition:weekday` - weekday mismatch
- `condition:weekday:missing_input` - no weekday provided
- `unsupportedConditionKey:mcc` - unknown key ignored

### v1 Boundaries
- Unknown keys are NOT errors - they're ignored with assumption
- Future: could add more keys to whitelist
- Not implementing full condition engine in v1

---

## conditions_json Status

| Key | Status | Notes |
|-----|--------|-------|
| channel | ✅ Supported | v1 |
| wallet | ✅ Supported | v1 |
| weekday | ✅ Supported | v1 |
| mcc | ❌ Ignored | Unknown key |
| card_type | ❌ Ignored | Unknown key |

---

## Explainability v1

### Card Result Fields

Each card result includes:

```js
{
  cardId,
  cardName,
  bankName,
  // Base reward explanation
  appliedRuleId: 1,
  appliedRuleSummary: {
    ruleId: 1,
    scope: 'merchant',  // merchant | category | base
    reward: '5% cashback',
    effectiveRate: '5%'
  },
  baseReward: { amount: 50, ... },
  // Offer explanation
  appliedOfferIds: [12, 19],
  appliedOfferSummaries: [
    { offerId: 12, title: 'Offer', summary: 'HK$50 fixed rebate', value: 50 },
    { offerId: 19, title: '5% Extra', summary: '5% extra cashback (capped at HK$100)', value: 100 }
  ],
  // Skipped offers
  skippedOfferIds: [15, 20],
  skippedOfferDetails: [
    { offerId: 15, title: 'Weekend Only', reason: 'condition:weekday' }
  ],
  // Debug assumptions
  assumptions: ['condition:wallet', 'threshold_type:MONTHLY_ACCUMULATED']
}
```

### Summary Format

- **appliedRuleSummary**: Human-readable rule explanation
- **appliedOfferSummaries**: Human-readable offer explanation with conditions
- **skippedOfferDetails**: Why offers were skipped
- **assumptions**: Debug information for unsupported features

---

## Production-Safe Fallback Behavior

### Invalid Data Handling

| Invalid Type | Behavior | Traceable Reason |
|------------|----------|------------------|
| null offer | Skip | `invalidOffer:null` |
| offer missing id | Skip | `invalidOffer:missingId` |
| invalid valueType | Skip | `invalidOffer:valueType` |
| invalid rateValue | Skip | `invalidRule:rateValue` |
| invalid conditions_json | Skip | `invalidConditionJson` |
| minSpend not met | Skip | `minSpend:not_met` |
| threshold_type unsupported | Skip | `threshold_type:XXX` |
| empty card list | Safe empty | Returns [] |
| no eligible results | Safe zero | Returns 0 |

### API Response Guarantees
Even with malformed data, API always returns:
```js
{
  success: boolean,
  results: [],   // Array (may be empty)
  bestCard: null // or null
}
```

---

## Input Resolution

### merchant-first Precedence

| Scenario | Behavior | Assumption |
|----------|-----------|-------------|
| merchant_id only | Use merchant | `merchantOverwritesCategory` |
| category_id only | Use category | `categoryOnly` |
| merchant + category | Merchant wins | `merchantOverwritesCategory` |
| Neither | Invalid request | `missing` |

### Category Derivation
If merchant exists but categoryId is missing:
- Try to derive category from merchant
- Record: `derivedCategoryFromMerchant`

### Conflict Handling
- Merchant always takes precedence
- Category value is NOT ignored - but merchant wins
- Assumption recorded for debugging

---

## Unknown/Partial Input Handling

### Cases

| Input | Behavior | Assumption |
|-------|----------|-------------|
| Unknown merchant + valid category | Use category | `unknownMerchant`, `usingCategoryAsFallback` |
| Known merchant + no category | Merchant-only | `merchantHasNoCategory` |
| Known merchant + derives category | Use derived | `categoryDerivedFromMerchant` |
| Unknown merchant + no category | Error | `missingMerchantAndCategory` |
| Category only | Use category | `categoryOnly` |
| Both invalid | Error | `missingMerchantAndCategory` |

### Fallback Rules
- merchant invalid + category valid → use category
- merchant valid, no category → try derive, else merchant-only
- both invalid → error with assumption

### Available Assumptions
- `input:unknownMerchant` - Merchant ID not found
- `input:unknownCategory` - Category ID not found  
- `input:categoryDerivedFromMerchant` - Category from merchant
- `input:merchantHasNoCategory` - Merchant exists but no category
- `input:usingCategoryAsFallback` - Using category as fallback
- `input:missingMerchantAndCategory` - Neither provided
