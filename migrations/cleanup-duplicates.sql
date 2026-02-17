-- Migration: Remove duplicate merchant rules
-- Run: npx psql DATABASE_URL -f cleanup-duplicates.sql

-- =====================================
-- STEP 1: Delete duplicates
-- =====================================

-- Find duplicates:
SELECT merchant_id, card_id, category_id, rate_unit, rate_value, COUNT(*) 
FROM reward_rules 
WHERE merchant_id IS NOT NULL 
GROUP BY merchant_id, card_id, category_id, rate_unit, rate_value 
HAVING COUNT(*) > 1;

-- Delete duplicates (keep smallest ID):
DELETE FROM reward_rules a 
USING reward_rules b 
WHERE a.id > b.id 
  AND a.merchant_id = b.merchant_id 
  AND a.card_id = b.card_id 
  AND a.category_id = b.category_id 
  AND a.rate_unit = b.rate_unit 
  AND a.rate_value = b.rate_value;

-- =====================================
-- STEP 2: Add unique indexes
-- =====================================

-- Merchant rules unique index (prevents duplicate merchant + card + rate)
CREATE UNIQUE INDEX uq_reward_rule_merchant ON reward_rules (
  card_id, 
  merchant_id, 
  rate_unit, 
  rate_value,
  COALESCE(per_amount, 0),
  COALESCE(valid_from, DATE '1970-01-01')
)
WHERE merchant_id IS NOT NULL;

-- Category rules unique index (prevents duplicate category + card + rate)
CREATE UNIQUE INDEX uq_reward_rule_category ON reward_rules (
  card_id, 
  category_id, 
  rate_unit, 
  rate_value,
  COALESCE(per_amount, 0),
  COALESCE(valid_from, DATE '1970-01-01')
)
WHERE merchant_id IS NULL;

-- =====================================
-- STEP 3: Verify
-- =====================================

-- Check remaining duplicates:
SELECT merchant_id, card_id, category_id, rate_unit, rate_value, COUNT(*) as cnt
FROM reward_rules 
WHERE merchant_id IS NOT NULL OR category_id IS NOT NULL
GROUP BY merchant_id, card_id, category_id, rate_unit, rate_value 
HAVING COUNT(*) > 1;

-- Show all rules:
SELECT id, card_id, merchant_id, category_id, rate_unit, rate_value, valid_from 
FROM reward_rules 
ORDER BY id;
