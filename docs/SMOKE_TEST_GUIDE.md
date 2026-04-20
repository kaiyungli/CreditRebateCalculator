# Publish Flow Smoke Test Guide

## Prerequisites

Before running smoke tests, ensure migration has been run:
- Run migration from docs/QUICK_MIGRATION.md in Supabase SQL Editor

## Smoke Test Scenarios

### Scenario 1: Clean Publish Test

**Purpose:** Test a new valid offer is published correctly

**Input (via API or direct):**
```json
{
  "merchant_id": 1,
  "category_id": 2, 
  "title": "Test Clean Offer",
  "offer_type": "general",
  "value_type": "PERCENT",
  "value": "5"
}
```

**Expected:**
- Status: `published`
- merchant_offers.created with fingerprint
- raw_offers.status → `published`

**DB Query:**
```sql
SELECT status, status_notes, processed_at 
FROM raw_offers ORDER BY id DESC LIMIT 1;
```

---

### Scenario 2: Duplicate Skip Test

**Purpose:** Test exact duplicate is skipped

**Input:**
First, publish an offer, then try to publish the same offer again.

**Expected:**
- Status: `skipped_duplicate`
- Fingerprint should match existing

---

### Scenario 3: Invalid Test

**Purpose:** Test invalid offer is handled

**Input:**
```json
{
  "merchant_id": 1,
  "title": "",  -- Empty title = invalid
  "value_type": "PERCENT",
  "value": "0"
}
```

**Expected:**
- Status: `invalid`

---

## Direct Test via DB

### Insert test raw_offers and try publish:

```sql
-- 1. Insert test raw offer
INSERT INTO raw_offers (title, reward_type, reward_value, source_url, source_name)
VALUES ('Smoke Test 1', 'percent', '5', 'https://test.com', 'test');

-- 2. Get its ID
SELECT id, title FROM raw_offers ORDER BY id DESC LIMIT 1;

-- 3. Try to publish via function (after migration runs)
-- The code should automatically update status
```

---

## Verification Queries

### Check raw_offers Table
```sql
SELECT id, title, status, status_notes::text, processed_at 
FROM raw_offers 
ORDER BY id DESC LIMIT 5;
```

### Check merchant_offers Latest
```sql
SELECT id, title, fingerprint, raw_offer_id, source_url, source_name, confidence, is_verified
FROM merchant_offers 
ORDER BY id DESC LIMIT 5;
```

---

## Expected Outputs

### Clean Publish Success (Example)
```
status: 'published'
fingerprint: '1|...|PERCENT|5|...'
raw_offer_id: 123
source_url: 'https://test.com'
source_name: 'test'
confidence: 'LOW'
is_verified: false
processed_at: '2024-04-20T06:xx:xxZ'
```

---

## Running Tests After Migration

1. **Run migration** in Supabase first (see docs/QUICK_MIGRATION.md)

2. **Insert test data** directly in raw_offers or via API

3. **Query results** using commands above

4. **Verify** fields match expected

---

## Current Test Files

Ready in tests/calculator/:
- migration-verify.test.js
- fingerprint.test.js
- publish.test.js
- publish-state.test.js

These will pass after migration is complete.
