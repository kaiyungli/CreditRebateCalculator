-- =====================================================
-- Migration: Optional indexes for performance
-- 
-- Status: OPTIONAL - Run later if needed
-- =====================================================

-- Performance indexes for common queries
-- ----------------------------------------

-- Index for fingerprint dedupe check
CREATE UNIQUE INDEX IF NOT EXISTS idx_merchant_offers_fingerprint 
ON merchant_offers(fingerprint) 
WHERE fingerprint IS NOT NULL;

-- Index for source queries
CREATE INDEX IF NOT EXISTS idx_merchant_offers_source 
ON merchant_offers(source_name);

CREATE INDEX IF NOT EXISTS idx_merchant_offers_raw_offer 
ON merchant_offers(raw_offer_id);

-- Index for offer lookup by merchant
CREATE INDEX IF NOT EXISTS idx_merchant_offers_lookup 
ON merchant_offers(merchant_id, status) 
WHERE status = 'ACTIVE';

-- Index for review queue
CREATE INDEX IF NOT EXISTS idx_merchant_offers_review 
ON merchant_offers(confidence, is_verified) 
WHERE confidence = 'LOW' AND is_verified = FALSE;

-- Index for raw_offers processing
CREATE INDEX IF NOT EXISTS idx_raw_offers_pending 
ON raw_offers(status) 
WHERE status = 'new';

-- Backfill fingerprint for existing published offers
-- (Optional - only run if you have tool to calculate fingerprints)
-- UPDATE merchant_offers m
-- SET fingerprint = (
--   SELECT generate_fingerprint(...) 
--   FROM normalize_offer(m.title, m.merchant_id, ...)
-- )
-- WHERE m.fingerprint IS NULL;


-- Verify indexes (optional - will just warn)
DO $$ 
BEGIN
    -- These are optional so we don't assert
    RAISE NOTICE 'Optional indexes migration complete - can be run later';
END $$;
