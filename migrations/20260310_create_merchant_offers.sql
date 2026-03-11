-- =====================================
-- MERCHANT_OFFERS (短期優惠)
-- =====================================
CREATE TABLE IF NOT EXISTS merchant_offers (
  id SERIAL PRIMARY KEY,
  
  -- Merchant (required)
  merchant_id INTEGER NOT NULL,
  merchant_name_snapshot VARCHAR(255),
  
  -- Card (optional - NULL = all cards)
  card_id INTEGER,
  
  -- Offer Details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- OFFER TYPE
  offer_type VARCHAR(20) NOT NULL,  
  -- COUPON | CASH_DISCOUNT | EXTRA_CASHBACK
  
  -- VALUE
  value_type VARCHAR(20),              -- PERCENT | FIXED | PER_SPEND
  value NUMERIC(12,6),               -- The actual value
  
  -- Requirements
  min_spend NUMERIC(12,2),           
  max_discount NUMERIC(12,2),        
  
  -- Stacking & Verification
  stackable BOOLEAN DEFAULT TRUE,     
  is_verified BOOLEAN DEFAULT FALSE, 
  
  -- Coupon Code
  code VARCHAR(50),                   
  url TEXT,                           
  
  -- Validity (REQUIRED for offers)
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  
  -- Tracking
  source VARCHAR(50),                 -- moneyhero | hongkongcard | manual | admin
  external_id VARCHAR(100),            
  
  -- Status
  status VARCHAR(20) DEFAULT 'ACTIVE',  -- ACTIVE | EXPIRED | PAUSED
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_offers_merchant ON merchant_offers(merchant_id);
CREATE INDEX IF NOT EXISTS idx_offers_card ON merchant_offers(card_id);
CREATE INDEX IF NOT EXISTS idx_offers_validity ON merchant_offers(valid_from, valid_to);
CREATE INDEX IF NOT EXISTS idx_offers_source ON merchant_offers(source);
CREATE INDEX IF NOT EXISTS idx_offers_type ON merchant_offers(offer_type);
CREATE INDEX IF NOT EXISTS idx_offers_status ON merchant_offers(status);
