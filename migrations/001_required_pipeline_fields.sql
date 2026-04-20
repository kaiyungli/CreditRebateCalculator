-- =====================================================
-- Migration: Add pipeline-required fields
-- Required for: Ingestion publish pipeline v1
-- 
-- IMPORTANT: Run this BEFORE scaling ingestion
-- =====================================================

-- STEP 1: Add missing fields to merchant_offers
-- ------------------------------------------

-- Fingerprint for deduplication (unique constraint later)
ALTER TABLE merchant_offers 
ADD COLUMN IF NOT EXISTS fingerprint VARCHAR(32);

-- Source traceability
ALTER TABLE merchant_offers 
ADD COLUMN IF NOT EXISTS raw_offer_id INTEGER;

ALTER TABLE merchant_offers 
ADD COLUMN IF NOT EXISTS source_url TEXT;

ALTER TABLE merchant_offers 
ADD COLUMN IF NOT EXISTS source_name VARCHAR(50);

ALTER TABLE merchant_offers 
ADD COLUMN IF NOT EXISTS parser_version VARCHAR(20);

ALTER TABLE merchant_offers 
ADD COLUMN IF NOT EXISTS parsed_at TIMESTAMP;

-- Review/confidence flags
ALTER TABLE merchant_offers 
ADD COLUMN IF NOT EXISTS confidence VARCHAR(10) DEFAULT 'LOW';

ALTER TABLE merchant_offers 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;


-- STEP 2: Create raw_offers if not exists
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS raw_offers (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    reward_type VARCHAR(20),
    reward_value TEXT,
    raw_text TEXT,
    source_url TEXT,
    source_name VARCHAR(50),
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Pipeline state tracking (NEW)
    status VARCHAR(20) DEFAULT 'new',
    status_notes JSONB,
    processed_at TIMESTAMP
);

-- Add indexes for pipeline
CREATE INDEX IF NOT EXISTS idx_raw_offers_status ON raw_offers(status);
CREATE INDEX IF NOT EXISTS idx_raw_offers_source ON raw_offers(source_name);


-- STEP 3: Add foreign key constraint for raw_offer_id
-- -------------------------------------------------
-- Note: Only after both tables have the column
ALTER TABLE merchant_offers 
ADD CONSTRAINT fk_merchant_offers_raw_offer 
FOREIGN KEY (raw_offer_id) REFERENCES raw_offers(id) ON DELETE SET NULL;


-- STEP 4: Backfill handling
-- -------------------------

-- For existing merchant_offers rows:
-- - fingerprint: NULL (will be calculated on next publish)
-- - raw_offer_id: NULL (no source)
-- - source_url/source_name: NULL (no source)
-- - parser_version: NULL (not parsed)
-- - parsed_at: NULL (not parsed)
-- - confidence: 'LOW' (default)
-- - is_verified: FALSE (default)

-- For existing raw_offers rows:
-- - status: 'new' (default)
-- - status_notes: NULL
-- - processed_at: NULL

-- No backfill needed - NULLs are acceptable for existing rows


-- STEP 5: Verify columns exist
-- ----------------------------
DO $$ 
BEGIN
    -- Verify merchant_offers
    ASSERT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'merchant_offers' AND column_name = 'fingerprint');
    ASSERT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'merchant_offers' AND column_name = 'raw_offer_id');
    ASSERT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'merchant_offers' AND column_name = 'source_url');
    ASSERT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'merchant_offers' AND column_name = 'source_name');
    ASSERT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'merchant_offers' AND column_name = 'parser_version');
    ASSERT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'merchant_offers' AND column_name = 'parsed_at');
    ASSERT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'merchant_offers' AND column_name = 'confidence');
    ASSERT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'merchant_offers' AND column_name = 'is_verified');
    
    -- Verify raw_offers
    ASSERT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'raw_offers' AND column_name = 'status');
    ASSERT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'raw_offers' AND column_name = 'status_notes');
    ASSERT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'raw_offers' AND column_name = 'processed_at');
    
    RAISE NOTICE 'Migration 001 completed successfully';
END $$;
