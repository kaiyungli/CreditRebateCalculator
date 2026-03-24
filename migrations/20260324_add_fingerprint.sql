-- Migration: Add fingerprint-based duplicate protection for merchant_offers
-- This migration is idempotent and handles existing data safely

-- Step 1: Add fingerprint column if not exists
ALTER TABLE merchant_offers ADD COLUMN IF NOT EXISTS fingerprint VARCHAR(100);

-- Step 2: Backfill fingerprint for all existing rows
-- Uses 'X' for NULL values to ensure consistent fingerprint
UPDATE merchant_offers 
SET fingerprint = COALESCE(merchant_id::text, 'X') || '_' || 
                bank_id::text || '_' || 
                COALESCE(category_id::text, 'X') || '_' || 
                value_type || '_' || 
                ROUND(value::numeric, 2)::text || '_' || 
                COALESCE(min_spend::text, '0')
WHERE fingerprint IS NULL;

-- Step 3: Identify and remove duplicates (keep lowest ID)
-- Create temp table with IDs to keep
CREATE TEMP TABLE duplicates_to_keep AS
SELECT MIN(id) as keep_id
FROM merchant_offers
GROUP BY fingerprint
HAVING COUNT(*) > 1;

-- Delete duplicates (keep only the one with lowest ID)
DELETE FROM merchant_offers 
WHERE id NOT IN (SELECT keep_id FROM duplicates_to_keep)
AND fingerprint IN (
  SELECT fingerprint 
  FROM merchant_offers 
  GROUP BY fingerprint 
  HAVING COUNT(*) > 1
);

DROP TABLE duplicates_to_keep;

-- Step 4: Add unique index on fingerprint
-- Uses WHERE to allow multiple NULL fingerprints (though we no longer have NULL after Step 2)
CREATE UNIQUE INDEX IF NOT EXISTS idx_merchant_offers_fingerprint 
ON merchant_offers(fingerprint) 
WHERE fingerprint IS NOT NULL;

-- Step 5: Make fingerprint NOT NULL for future inserts
-- (optional - uncomment if you want to enforce fingerprint on all new rows)
-- ALTER TABLE merchant_offers ALTER COLUMN fingerprint SET NOT NULL;

-- Verify migration
SELECT 
  'fingerprint column' as check_item,
  COUNT(*) as result
FROM information_schema.columns 
WHERE table_name = 'merchant_offers' AND column_name = 'fingerprint'
UNION ALL
SELECT 
  'unique index' as check_item,
  COUNT(*) as result
FROM pg_indexes 
WHERE tablename = 'merchant_offers' AND indexname = 'idx_merchant_offers_fingerprint'
UNION ALL
SELECT 
  'total offers' as check_item,
  COUNT(*) as result
FROM merchant_offers;
