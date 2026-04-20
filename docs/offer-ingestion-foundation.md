# Offer Ingestion Foundation

## 1. Duplicate Detection

### What Makes Two Offers Duplicates

An offer is considered a duplicate if these key fields match:

| Field | Weight | Notes |
|-------|--------|-------|
| merchant_id | High | Primary targeting |
| bank_id | High | Bank restriction |
| card_id | High | Card restriction |
| category_id | Medium | Category fallback |
| offer_type | High | Walk / Playdate / etc |
| value_type | High | FIXED / PERCENT |
| value | High | The reward value |
| min_spend | Medium | Minimum spend threshold |
| max_reward | Low | Cap (if fixed offer) |
| stackable | High | Stacking behavior |
| threshold_type | Medium | PER_TXN vs accumulated |
| conditions | Medium | Channel/wallet/weekday |

### Fingerprint Formula

```js
// Proposed fingerprint hash
fingerprint = md5(
  merchant_id +
  bank_id +
  card_id +
  category_id +
  offer_type +
  value_type +
  value +
  min_spend +
  max_reward +
  stackable +
  threshold_type +
  JSON.stringify(conditions)
)
```

### Duplicate Types

| Type | Definition | Action |
|------|------------|--------|
| Exact | All key fields identical | Skip duplicate |
| Near | Value differs by <10% | Flag for review |
| Conflict | Same target, higher value | Flag for review |
| Overlap | Date ranges overlap | Flag for review |

---

## 2. Source Traceability

### Source Linkage Flow

```
raw_offers → Parser → Validator → Dedupe → Normalize → merchant_offers
                                              ↑
                                              raw_offer_id ← source_url
```

### Required Fields for Source Tracking

| Field | Table | Type | Purpose |
|-------|-------|------|---------|
| raw_offer_id | merchant_offers | INTEGER | Link to raw_offers |
| source_url | merchant_offers | TEXT | Source URL for audit |
| source_name | merchant_offers | TEXT | Source (e.g., HSBC) |
| parser_version | merchant_offers | VARCHAR | Parser version |
| parsed_at | merchant_offers | TIMESTAMP | When parsed |
| reviewed_at | merchant_offers | TIMESTAMP | When reviewed (future) |
| reviewed_by | merchant_offers | INTEGER | User ID (future) |
| confidence | merchant_offers | VARCHAR | HIGH/MEDIUM/LOW |
| is_verified | merchant_offers | BOOLEAN | Reviewed flag |

### raw_offers Table

| Field | Type | Notes |
|-------|------|-------|
| id | SERIAL | Primary key |
| title | TEXT | Raw title |
| reward_type | VARCHAR | Raw value type |
| reward_value | TEXT | Raw value string |
| raw_text | TEXT | Full scraped text |
| source_url | TEXT | Original URL |
| source_name | TEXT | Site name |
| scraped_at | TIMESTAMP | When scraped |

---

## 3. Duplicate Handling Policy

### Detection Priority

1. **Exact duplicates** - Automatically skip
2. **Higher value wins** - For conflicting with higher value
3. **Review for human decision** - Near/overlap cases

### Policy Rules

| Case | Action |
|------|--------|
| merchant_id + value + offer_type match exactly | Skip duplicate |
|merchant_id + offer_type match, value differs <10% | Flag for review |
|merchant_id + offer_type match, higher value exists | Skip lower, flag review |
| Date ranges overlap | Flag for review |

### Implementation Logic

```js
// Pseudocode for dedupe check
function shouldOfferBeSkipped(newOffer, existingOffers) {
  const nearMatch = existingOffers.find(o => 
    o.fingerprint === newFingerprint && 
    o.value < newOffer.value * 1.1  // within 10%
  )
  
  if (nearMatch) {
    return { status: 'REVIEW', reason: 'near_duplicate' }
  }
  
  const exact = existingOffers.find(o => o.fingerprint === newFingerprint)
  if (exact) {
    return { status: 'SKIP', reason: 'exact_duplicate' }
  }
  
  return { status: 'NEW', reason: 'first_offer' }
}
```

---

## 4. Migration Backlog

### Schema Changes

| Priority | Migration | Type |
|----------|-----------|------|
| HIGH | Add fingerprint column to merchant_offers | Schema |
| HIGH | Add source tracking columns | Schema |
| HIGH | Add unique index on fingerprint | Schema |
| MEDIUM | Add confidence/review columns | Schema |
| MEDIUM | Add raw_offer_id foreign key | Schema |
| LOW | Add useful indexes | Performance |

### Column Changes

```sql
-- merchant_offers additions
ALTER TABLE merchant_offers ADD COLUMN fingerprint VARCHAR(32);
ALTER TABLE merchant_offers ADD COLUMN raw_offer_id INTEGER REFERENCES raw_offers(id);
ALTER TABLE merchant_offers ADD COLUMN source_url TEXT;
ALTER TABLE merchant_offers ADD COLUMN source_name VARCHAR(50);
ALTER TABLE merchant_offers ADD COLUMN parser_version VARCHAR(20);
ALTER TABLE merchant_offers ADD COLUMN parsed_at TIMESTAMP;
ALTER TABLE merchant_offers ADD COLUMN confidence VARCHAR(10) DEFAULT 'LOW';
ALTER TABLE merchant_offers ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;

-- Index for dedupe
CREATE UNIQUE INDEX idx_offer_fingerprint ON merchant_offers(fingerprint);
CREATE INDEX idx_offer_merchant ON merchant_offers(merchant_id);
CREATE INDEX idx_offer_source ON merchant_offers(source_name);
```

---

## 5. Implementation Priority

### Phase 1: Foundation (Build First)

| Step | Description | Code/SQL |
|------|------------|----------|
| 1.1 | Add fingerprint field to merchant_offers | Schema migration |
| 1.2 | Add parser_version and parsed_at | Schema migration |
| 1.3 | Build fingerprint calculation in parser | Code: offerNormalizer |
| 1.4 | Build fingerprint check before insert | Code: normalizeAndInsert |

### Phase 2: Source Tracking

| Step | Description | Code/SQL |
|------|------------|----------|
| 2.1 | Add source fields (raw_offer_id, source_url, source_name) | Schema migration |
| 2.2 | Pass raw_offer_id through normalization | Code: offerNormalizer |
| 2.3 | Store source in insert | Code: normalizeAndInsert |

### Phase 3: Review Flags

| Step | Description | Code/SQL |
|------|------------|----------|
| 3.1 | Add confidence/review columns | Schema migration |
| 3.2 | Add review UI support | NOT IN SCOPE |
| 3.3 | Build manual review flow | NOT IN SCOPE |

---

## 6. Current State vs Target

| Feature | Current | Target |
|---------|---------|---------|
| Dedup | ❌ None | ✅ Fingerprint check |
| Source | ❌ Not stored | ✅ raw_offer_id link |
| Review | ❌ None | ✅ Confidence flags |
| Historical | N/A | ✅ via raw_offers |

---

## 7. Summary

### Fingerprint Proposal
- Hash of: merchant_id + bank_id + card_id + category_id + offer_type + value_type + value + min_spend + stackable + threshold_type + conditions

### Source Traceability
- Link to raw_offers via raw_offer_id
- Store source_url, source_name, parser_version, parsed_at

### Priority
1. **Build first**: Fingerprint field + calculation
2. **Migration first**: Add fingerprint column
3. **Then**: Source tracking fields
4. **Later**: Review/confidence flags

---

## Canonicalization and Fingerprint Rules

### Canonicalization Rules

1. **Object keys**: Sorted alphabetically
2. **String values**: Lowercase + trim
3. **Arrays**: Sorted alphabetically then joined with comma
4. **Nested objects**: Recursively canonicalized
5. **Null/undefined**: Converted to empty string

### Fingerprint Fields (Identity Only)

Excluded from fingerprint (not identity):
- valid_from / valid_to (changes over time)
- source_url / source_name (metadata)
- raw_offer_id (link not identity)
- is_verified / confidence (review flags)
- id (auto-assigned)

### Fingerprint Algorithm

```
fingerprint = "merchant_id|bank_id|card_id|category_id|offer_type|value_type|value|min_spend|max_reward|stackable|threshold_type|canonicalized_conditions"
```

### Example

Input A: `{ channel: "ONLINE", wallet: "Apple" }`
Input B: `{ wallet: "apple", channel: "online" }`
→ Same canonicalization → Same fingerprint ✅

---

## Ingestion Publish Pipeline v1

### Flow

```
raw_offer → parseRawOffer() → normalizeParsedOffer() 
  → generateFingerprint() → checkDuplicate() 
    → publishOffer() → merchant_offers
```

### Publish Statuses

| Status | Meaning | Action |
|--------|----------|--------|
| published | Clean new offer | Insert to merchant_offers |
| skipped_duplicate | Exact fingerprint match | Skip insert |
| review_needed | Near match, different value | Flag for manual review |
| invalid | Parse/normalization failed | Skip, log reason |

### Pipeline Steps

1. **Parse**: Convert raw_offers to structured object
2. **Normalize**: Map fields to schema (snake_case)
3. **Fingerprint**: Generate identity hash
4. **Duplicate Check**: Query existing offers by fingerprint
5. **Publish**: Insert clean or skip/flag

### Code Location

- `src/domains/ingestion/publishers/offerPublisher.js`

### Still Manual/Unsupported

- Cron automation for cron jobs
- Full raw_offers scraping pipeline
- Admin review UI
- Confidence score algorithm
