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
