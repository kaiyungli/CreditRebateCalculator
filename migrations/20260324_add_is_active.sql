-- Migration: Add is_active field for offer validity management
-- This enables active/inactive filtering for offers

-- Step 1: Add is_active boolean column (default true for new offers)
ALTER TABLE merchant_offers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Step 2: Ensure existing active offers are marked as active
UPDATE merchant_offers SET is_active = true WHERE status = 'ACTIVE' AND is_active IS NULL;

-- Step 3: Add unique constraint on fingerprint (if not already done)
-- Note: Already covered in previous migration

-- Verification
SELECT 
  'Total offers' as metric,
  COUNT(*)::text as value
FROM merchant_offers
UNION ALL
SELECT 
  'Active offers' as metric, 
  COUNT(CASE WHEN is_active = true THEN 1 END)::text
FROM merchant_offers
UNION ALL
SELECT 
  'With start_date' as metric, 
  COUNT(CASE WHEN start_date IS NOT NULL THEN 1 END)::text
FROM merchant_offers
UNION ALL
SELECT 
  'With end_date' as metric, 
  COUNT(CASE WHEN end_date IS NOT NULL THEN 1 END)::text
FROM merchant_offers;
