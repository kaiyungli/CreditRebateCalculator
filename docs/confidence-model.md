# Confidence Model for Offer Ingestion

## Overview

The confidence model assigns a confidence level to each parsed offer during ingestion, enabling automated quality decisions and review prioritization.

---

## Confidence Levels

| Level | Score | Meaning |
|-------|-------|---------|
| HIGH | 60-100 | Clear, complete offer data |
| MEDIUM | 30-59 | Some ambiguity present |
| LOW | 0-29 | Missing fields or unclear data |

---

## HIGH Confidence Rules

- Clear numeric value
- Known merchant matched
- Valid valueType (PERCENT/FIXED)
- (bonus: category matched, valid minSpend, bank/card identified)

---

## MEDIUM Confidence Rules

- Has value + merchant OR category
- Minor missing fields
- Some ambiguity in parsing

---

## LOW Confidence Rules

- Missing value
- No merchant or category
- Fuzzy/unusual value formats
- Missing required fields

---

## Review Triggers

An offer requires review if:

| Trigger | Condition |
|--------|-----------|
| low_confidence | confidence = LOW |
| near_duplicate | fingerprint matches different source |
| conflict_detected | same merchant/card, different value |
| suspiciously_high_value | >50% PERCENT offer |
| unsupported_conditions | Unsupported condition keys exist |

---

## Publish Decision Logic

```
IF missing required value → invalid
ELSE IF exact duplicate → skipped_duplicate  
ELSE IF review_triggered → review_needed
ELSE → published (with LOW confidence flagged)
```

---

## Status Transitions

| Decision | raw_offers.status | Notes |
|-----------|-------------------|-------|
| published | published | fingerprint, confidence |
| skipped_duplicate | skipped_duplicate | duplicate info |
| review_needed | review_needed | triggers list |
| invalid | invalid | reason |

---

## Duplicate Types

| Type | Definition | Action |
|------|------------|--------|
| exact | Same fingerprint | skipped_duplicate |
| near | Fingerprint matches, different source | review_needed |
| conflict | Same merchant/card, different value | review_needed |
| allowed | Same source, different fingerprint | published |

---

## Examples

### HIGH confidence → published
```
{ value: '5', valueType: 'PERCENT', merchantId: 1 }
→ confidence: HIGH → published
```

### LOW confidence → review_needed
```
{ title: 'Some offer' }
→ confidence: LOW → review_needed (low_confidence)
```

### Duplicate → skipped
```
{ fingerprint: 'EXISTS' }
→ exact_duplicate → skipped_duplicate
```

### Conflict → review
```
{ merchantId: 1, cardId: 1, value: '10' } vs existing = {5}
→ conflict_detected → review_needed
```

---

## Files

- `src/domains/ingestion/confidence.js` - Model logic
- `tests/calculator/confidence.test.mjs` - Tests
