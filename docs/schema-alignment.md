# Schema Alignment - Repository Contracts

## Current State

### Output Shape Standard

| Repository | Current Output | Chosen Standard |
|-----------|---------------|---------------|
| cardsRepository | camelCase: `card_name`, `bank_name` | ✅ camelCase (normalized) |
| rulesRepository | camelCase: `card_name`, `bank_name`, `scope_type` | ✅ camelCase (normalized) |
| offersRepository | snake_case: raw DB row | ❌ Need normalization |

**Decision:** Standardize on **normalized camelCase** for domain objects.

---

## Domain ↔ Table Mapping

| Domain | Repository | Table | Fields Used |
|--------|-----------|-------|------------|
| cards | cardsRepository | `cards` | id, name, bank_id, reward_program, annual_fee, image_url, apply_url |
| rewards | rulesRepository | `reward_rules` | id, card_id, merchant_id, category_id, reward_kind, rate_unit, rate_value, per_amount, cap_value, min_spend, priority |
| offers | offersRepository | `merchant_offers` | id, merchant_id, bank_id, card_id, title, offer_type, value_type, value, min_spend, max_discount, start_date, end_date, is_active |

---

## Repository Output Contracts

### cardsRepository.findAllCards()
**Output:**
```js
{
  id: number,
  card_id: number,
  card_name: string,
  bank_id: number,
  bank_name: string,
  reward_program: string,
  network: string,
  annual_fee: number,
  image_url: string,
  apply_url: string
}
```

### rulesRepository.findRules()
**Output:**
```js
{
  id: number,
  card_id: number,
  merchant_id: number | null,
  category_id: number | null,
  reward_kind: string,
  rate_unit: string,
  rate_value: number,
  per_amount: number | null,
  cap_value: number | null,
  cap_period: string,
  min_spend: number | null,
  priority: number,
  card_name: string,
  bank_name: string
}
```

### offersRepository.findOffers()
**Current (needs fix):** Returns raw snake_case DB row

**Target (normalized):**
```js
{
  id: number,
  merchantId: number | null,
  bankId: number | null,
  cardId: number | null,
  title: string,
  offerType: string,
  valueType: string,
  value: number,
  minSpend: number | null,
  maxDiscount: number | null,
  startDate: string | null,
  endDate: string | null,
  isActive: boolean
}
```

---

## Unused Schema Fields

### cards table
- `card_type` - Not used (type of card)
- `status` - Filtered, not returned
- `created_at`, `updated_at` - Metadata, not returned

### reward_rules table  
- `valid_from`, `valid_to` - Filtered in JavaScript, not returned
- `status` - Filtered, not returned
- `description` - Not used
- `terms` - Not used

### merchant_offers table
- `source` - Not returned (for traceability)
- `is_verified` - Not returned
- `description` - Not returned
- `valid_from`, `valid_to` - Filtered, not returned as separate fields
- `fingerprint` - Not used but exists

---

## Schema Gaps / Migration Backlog

### 1. merchant_key Uniqueness
**Current:** `merchants.merchant_key` has no unique constraint
**Issue:** Duplicate merchants possible
**Priority:** Medium

### 2. merchant_offers Fingerprint
**Status:** Column exists but not populated consistently
**Issue:** Cannot detect duplicates reliably
**Priority:** Medium

### 3. source Traceability
**Current:** No way to track offer source (scraper, manual, etc.)
**Priority:** Low

### 4. raw_offers Statuses
**Current:** `source` field exists but meanings unclear
**Need:** Document source meanings
**Priority:** Low

### 5. user_cards Uniqueness
**Current:** No unique constraint on (user_id, card_id)
**Issue:** User can have duplicate card selections
**Priority:** Medium

### 6. Useful Indexes
Missing indexes:
- `cards(bank_id, status)`
- `reward_rules(card_id, status)`
- `merchant_offers(merchant_id, status)`
- `merchant_offers(bank_id, status)`
**Priority:** Low

---

## Migration Backlog Summary

| # | Migration | Priority | Issue |
|---|----------|----------|-------|
| 1 | Add unique constraint on `merchants.merchant_key` | Medium | Duplicate merchants |
| 2 | Populate `merchant_offers.fingerprint` consistently | Medium | Duplicate detection |
| 3 | Document `raw_offers.source` meanings | Low | Traceability |
| 4 | Add unique constraint on `user_cards(user_id, card_id)` | Medium | Duplicate selections |
| 5 | Add missing indexes | Low | Query performance |

---

## Notes

- Repository contracts should return normalized camelCase objects
- Raw DB queries stay in lib/db.js (infrastructure layer)
- Repositories may transform but should be consistent
- This document tracks DB ↔ domain alignment for future migrations

---

## Field Naming: max_reward → maxReward

**DB Field:** `merchant_offers.max_reward`  
**Domain Field:** `maxReward`  
**Mapping:** `offer.max_reward` → `maxReward`

**Usage:**
- `normalizeOffer()`: maps `max_reward` → `maxReward`
- `offerEvaluator`: uses `maxReward` (NOT maxDiscount)

---

## saveCalculation Schema Alignment

**DB Table:** `calculations`  
**Schema:**
```sql
id SERIAL PRIMARY KEY,
user_id INTEGER REFERENCES users(id),
input_json JSONB NOT NULL,
result_json JSONB NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**Payload (matches schema):**
```js
{
  user_id,        // number
  input_json: { merchant_id, category_id, amount, card_ids },
  result_json: { results, bestCard }
}
```

**Validation:** ✅ Payload aligns with actual table schema

