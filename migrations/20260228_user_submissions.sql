-- ============================================
-- Migration: Add User Submission Features
-- Created: 2026-02-28
-- ============================================

-- ============================================
-- OPTION 1: Add columns to merchant_rates
-- ============================================

ALTER TABLE merchant_rates ADD COLUMN IF NOT EXISTS source VARCHAR(50);
ALTER TABLE merchant_rates ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE merchant_rates ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE merchant_rates ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE merchant_rates ADD COLUMN IF NOT EXISTS submitted_by VARCHAR(100);
ALTER TABLE merchant_rates ADD COLUMN IF NOT EXISTS verification_votes INT DEFAULT 0;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_merchant_rates_source ON merchant_rates(source);
CREATE INDEX IF NOT EXISTS idx_merchant_rates_submitted_by ON merchant_rates(submitted_by);
CREATE INDEX IF NOT EXISTS idx_merchant_rates_is_verified ON merchant_rates(is_verified);

-- ============================================
-- OPTION 2: Create user offer submissions table
-- ============================================

CREATE TABLE IF NOT EXISTS user_offer_submissions (
    id SERIAL PRIMARY KEY,
    merchant_name VARCHAR(255) NOT NULL,
    merchant_name_en VARCHAR(255),
    offer TEXT NOT NULL,
    bank_id INTEGER REFERENCES banks(id),
    category_id INTEGER REFERENCES categories(id),
    notes TEXT,
    submitted_by VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for user_offer_submissions
CREATE INDEX IF NOT EXISTS idx_user_offer_submissions_status ON user_offer_submissions(status);
CREATE INDEX IF NOT EXISTS idx_user_offer_submissions_submitted_by ON user_offer_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_user_offer_submissions_bank ON user_offer_submissions(bank_id);
CREATE INDEX IF NOT EXISTS idx_user_offer_submissions_category ON user_offer_submissions(category_id);

-- ============================================
-- OPTION 2: Create offer votes table
-- ============================================

CREATE TABLE IF NOT EXISTS offer_votes (
    id SERIAL PRIMARY KEY,
    offer_id INTEGER NOT NULL REFERENCES user_offer_submissions(id) ON DELETE CASCADE,
    vote VARCHAR(10) NOT NULL CHECK (vote IN ('upvote', 'downvote')),
    user_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for offer_votes
CREATE INDEX IF NOT EXISTS idx_offer_votes_offer_id ON offer_votes(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_votes_user_id ON offer_votes(user_id);

-- ============================================
-- Add status column update trigger function
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_offer_submissions
DROP TRIGGER IF EXISTS update_user_offer_submissions_updated_at ON user_offer_submissions;
CREATE TRIGGER update_user_offer_submissions_updated_at
    BEFORE UPDATE ON user_offer_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- END OF MIGRATION
-- ============================================
