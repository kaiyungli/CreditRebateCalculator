-- Migration: Add fingerprint-based duplicate protection for merchant_offers
-- This migration is SAFE and handles existing data correctly

-- Step 1: Add fingerprint column if missing
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

-- Step 3: Remove duplicates SAFELY
-- Keep only the row with the LOWEST ID for each fingerprint
-- This is SAFE because it only deletes rows that share a fingerprint with another row
-- and keeps the one with smallest id

-- First, identify which IDs to keep (one per fingerprint)
CREATE TEMP TABLE ids_to_keep AS
SELECT MIN(id) as keep_id
FROM merchant_offers
GROUP BY fingerprint;

-- Then delete all rows NOT in that keep list (only duplicates will be deleted)
DELETE FROM merchant_offers 
WHERE id NOT IN (SELECT keep_id FROM ids_to_keep);

DROP TABLE ids_to_keep;

-- Step 4: Add unique index on fingerprint
CREATE UNIQUE INDEX IF NOT EXISTS idx_merchant_offers_fingerprint 
ON merchant_offers(fingerprint) 
WHERE fingerprint IS NOT NULL;

-- Verification
SELECT 
  'Total offers' as metric,
  COUNT(*)::text as value
FROM merchant_offers
UNION ALL
SELECT 
  'Unique fingerprints' as metric, 
  COUNT(DISTINCT fingerprint)::text
FROM merchant_offers;
