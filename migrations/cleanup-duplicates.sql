-- Migration: Remove duplicate merchant rules
-- Run: npx psql DATABASE_URL -f cleanup-duplicates.sql

-- Find duplicates:
-- SELECT merchant_id, card_id, category_id, rate_unit, rate_value, COUNT(*) 
-- FROM reward_rules 
-- WHERE merchant_id IS NOT NULL 
-- GROUP BY merchant_id, card_id, category_id, rate_unit, rate_value 
-- HAVING COUNT(*) > 1;

-- Delete duplicates (keep one with lowest ID):
DELETE FROM reward_rules 
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY merchant_id, card_id, category_id, rate_unit, rate_value 
      ORDER BY id
    ) as rn
    FROM reward_rules 
    WHERE merchant_id IS NOT NULL
  ) t
  WHERE rn > 1
);

-- Verify:
-- SELECT merchant_id, card_id, category_id, rate_unit, rate_value, COUNT(*) 
-- FROM reward_rules 
-- WHERE merchant_id IS NOT NULL 
-- GROUP BY merchant_id, card_id, category_id, rate_unit, rate_value 
-- HAVING COUNT(*) > 1;
