-- Migration: Remove duplicate merchant rules
-- Run: npx psql DATABASE_URL -f cleanup-duplicates.sql

-- Find duplicates:
-- SELECT merchant_id, card_id, category_id, rate_unit, rate_value, COUNT(*) 
-- FROM reward_rules 
-- WHERE merchant_id IS NOT NULL 
-- GROUP BY merchant_id, card_id, category_id, rate_unit, rate_value 
-- HAVING COUNT(*) > 1;

-- Delete duplicates (keep smallest ID):
DELETE FROM reward_rules a 
USING reward_rules b 
WHERE a.id > b.id 
  AND a.merchant_id = b.merchant_id 
  AND a.card_id = b.card_id 
  AND a.category_id = b.category_id 
  AND a.rate_unit = b.rate_unit 
  AND a.rate_value = b.rate_value;

-- Verify:
-- SELECT merchant_id, card_id, category_id, rate_unit, rate_value, COUNT(*) as cnt
-- FROM reward_rules 
-- WHERE merchant_id IS NOT NULL 
-- GROUP BY merchant_id, card_id, category_id, rate_unit, rate_value 
-- HAVING COUNT(*) > 1;

-- Show remaining rules:
-- SELECT id, merchant_id, card_id, category_id, rate_unit, rate_value FROM reward_rules WHERE merchant_id IS NOT NULL ORDER BY id;
