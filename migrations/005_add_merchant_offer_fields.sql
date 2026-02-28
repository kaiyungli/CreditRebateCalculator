-- ============================================
-- MIGRATION: Add fields for merchant offers tracking
-- Project: CreditRebateCalculator
-- Description: Add source tracking, dates, verification, and user submission fields
-- ============================================

-- Add new columns to merchant_rates table
ALTER TABLE merchant_rates ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'scraped';
ALTER TABLE merchant_rates ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE merchant_rates ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE merchant_rates ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE merchant_rates ADD COLUMN IF NOT EXISTS submitted_by VARCHAR(100);
ALTER TABLE merchant_rates ADD COLUMN IF NOT EXISTS verification_votes INT DEFAULT 0;

-- Add index for source column
CREATE INDEX IF NOT EXISTS idx_merchant_rates_source ON merchant_rates(source);

-- Add index for verification status
CREATE INDEX IF NOT EXISTS idx_merchant_rates_verified ON merchant_rates(is_verified);

-- ============================================
-- Optional: Create user_offer_submissions table
-- Use this if you want separate tracking of user-submitted offers
-- ============================================

CREATE TABLE IF NOT EXISTS user_offer_submissions (
    id SERIAL PRIMARY KEY,
    merchant_rate_id INTEGER REFERENCES merchant_rates(id),
    user_id INTEGER REFERENCES users(id),
    suggested_rate DECIMAL(5,3) NOT NULL,
    suggested_rebate_type VARCHAR(50),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING | APPROVED | REJECTED
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_offer_submissions_rate ON user_offer_submissions(merchant_rate_id);
CREATE INDEX IF NOT EXISTS idx_offer_submissions_user ON user_offer_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_offer_submissions_status ON user_offer_submissions(status);

-- ============================================
-- Optional: Create offer_votes table
-- For community verification of user-submitted offers
-- ============================================

CREATE TABLE IF NOT EXISTS offer_votes (
    id SERIAL PRIMARY KEY,
    merchant_rate_id INTEGER REFERENCES merchant_rates(id),
    user_id INTEGER REFERENCES users(id),
    vote_value INTEGER DEFAULT 1, -- +1 for upvote, -1 for downvote
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(merchant_rate_id, user_id) -- One vote per user per offer
);

CREATE INDEX IF NOT EXISTS idx_offer_votes_rate ON offer_votes(merchant_rate_id);
CREATE INDEX IF NOT EXISTS idx_offer_votes_user ON offer_votes(user_id);

-- ============================================
-- Function: Update verification_votes count
-- ============================================

CREATE OR REPLACE FUNCTION update_verification_votes()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE merchant_rates
    SET verification_votes = (
        SELECT COALESCE(SUM(vote_value), 0)
        FROM offer_votes
        WHERE merchant_rate_id = NEW.merchant_rate_id
    )
    WHERE id = NEW.merchant_rate_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update verification_votes
DROP TRIGGER IF EXISTS trigger_update_votes ON offer_votes;
CREATE TRIGGER trigger_update_votes
AFTER INSERT OR UPDATE OR DELETE ON offer_votes
FOR EACH ROW EXECUTE FUNCTION update_verification_votes();

-- ============================================
-- End of Migration
-- ============================================
