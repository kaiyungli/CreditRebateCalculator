# Data Readiness Review

## Executive Summary

The calculation engine is functionally ready with proper domain architecture, defensive handling, and explainability. However, data quality concerns exist that should be addressed before wider production use.

---

## 1. Tables Active Usage

### Actively Used by Engine

| Table | Usage | Status |
|-------|-------|--------|
| **cards** | ✅ Full | Card lookup |
| **reward_rules** | ✅ Full | Base calculation |
| **merchant_offers** | ✅ Full | Offer calculation |
| **merchants** | ✅ Partial | Category derivation |
| **categories** | ✅ Full | Category lookup |
| **banks** | ✅ Full | Card → bank lookup |

### Support Tables (Not Core)

| Table | Usage | Status |
|-------|-------|--------|
| raw_offers | ❌ Not used | Scraping source |
| user_cards | ❌ Not in engine | User preferences |
| users | ❌ Not in engine | Auth only |
| calculations | ✅ History only | Logging |

---

## 2. Schema Fields Usage

### reward_rules

| Field | Engine Uses | Notes |
|-------|-----------|-------|
| card_id | ✅ Yes | Required |
| merchant_id | ✅ Yes | Scope selection |
| category_id | ✅ Yes | Scope selection |
| rate_unit | ✅ Yes | PERCENT/FIXED/PER_AMOUNT |
| rate_value | ✅ Yes | The reward value |
| cap_value | ✅ Yes | Monthly cap |
| min_spend | ✅ Yes | Minimum spend check |
| priority | ✅ Yes | Tie-breaker |
| valid_from/valid_to | ✅ Yes | Date validity |
| reward_kind | ✅ Yes | CASHBACK/POINTS |
| threshold_type | ⚠️ Partial | PER_TXN only |
| conditions_json | ⚠️ Partial | channel/wallet/weekday |
| per_amount | ✅ Yes | PER_AMOUNT support |
| **cap_period** | ❌ Not used | Monthly assumed |
| **description** | ❌ Not used | No display |
| **terms** | ❌ Not used | No display |

### merchant_offers

| Field | Engine Uses | Notes |
|-------|-----------|-------|
| merchant_id | ✅ Yes | Offer targeting |
| card_id | ✅ Yes | Card restriction |
| bank_id | ✅ Yes | Bank restriction |
| value_type | ✅ Yes | FIXED/PERCENT |
| value | ✅ Yes | The value |
| min_spend | ✅ Yes | Min spend check |
| max_reward | ✅ Yes | Reward cap |
| start_date/end_date | ✅ Yes | Date validity |
| stackable | ✅ Yes | v1 stackable logic |
| threshold_type | ⚠️ Partial | PER_TXN only |
| conditions | ⚠️ Partial | channel/wallet/weekday |
| **title** | ✅ Yes | Display |
| **offer_type** | ⚠️ Partial | Saved not used |
| **description** | ❌ Not used | No display |
| **fingerprint** | ❌ Not populated | Duplicate detection |
| **source** | ❌ Not used | Traceability |
| **is_verified** | ❌ Not used | Confidence flag |

### cards

| Field | Engine Uses | Notes |
|-------|-----------|-------|
| name | ✅ Yes | Display |
| bank_id | ✅ Yes | Bank lookup |
| reward_program | ✅ Yes | Display |
| annual_fee | ✅ Yes | Display |
| image_url/apply_url | ✅ Yes | Display |
| network | ✅ Yes | Card network |
| **card_type** | ❌ Not used | Type tag |
| **status** | ✅ Yes | Active filter |

---

## 3. Data Quality Risks

### High Priority

| Risk | Impact | Mitigation |
|------|--------|-----------|
| No duplicate prevention | Duplicate offers can coexist | Add fingerprint or unique key |
| No source traceability | Can't audit origin | Add source field |
| raw_offers not parsed | Scraped data unused | Build parser pipeline |
| No confidence flags | Can't trust offer validity | Add is_verified |

### Medium Priority

| Risk | Impact | Mitigation |
|------|--------|-----------|
| fingerprint not populated | Can't find duplicates | Run migration |
| no unique merchant key | Duplicate merchants possible | Add unique constraint |
| terms/description unused | No offer details | Optional display |

---

## 4. Ingestion Flow Gaps

### Current Flow
```
raw_offers → [No Parse] → merchant_offers
```

### Needed Flow
```
raw_offers → parser → validator → dedupe check → normalize → merchant_offers
```

**Missing components:**
1. **Parser** - Parse raw offer text→structured
2. **Validator** - Validate parsed offer
3. **Dedupe** - Check for duplicates using fingerprint
4. **Normalization** - Map to schema

---

## 5. Migration Backlog

| Priority | Migration | Notes |
|----------|-----------|-------|
| High | Populate merchant_offers.fingerprint | Unique offer ID |
| High | Add source field tracking | Trace origin |
| Medium | Add unique constraint on merchants.merchant_key | Prevent duplicates |
| Medium | Add confidence flag (is_verified) | Trust signals |
| Low | Add useful indexes | Query performance |
| Low | Populate raw_offers.fingerprint | Full dedupe capability |

---

## 6. Priority List for Production

### Before Wider Use (Must Fix)

1. **Add fingerprint or dedupe prevention**
   - Currently offers can duplicate
   - Critical for offer quality

2. **Add source tracking**
   - Can't audit offer origin
   - Need source field

3. **Build simple parser**
   - raw_offers exists but unused
   - Need ingestion pipeline

### Can Wait (Nice to Have)

1. Add is_verified confidence flag
2. Add unique merchant key
3. Add useful indexes

---

## 7. Summary

| Area | Readiness |
|------|-----------|
| Engine Logic | ✅ Production ready |
| Schema Coverage | ⚠️ Mostly ready |
| Data Quality | ⚠️ Needs fingerprint/source |
| Ingestion Pipeline | ❌ Not ready |
| Deduplication | ❌ Not ready |
| Source Traceability | ❌ Not ready |

**Recommendation:** Fix high priority items before scaling beyond test merchants.
