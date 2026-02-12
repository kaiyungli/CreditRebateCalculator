-- Credit Card Rebate Calculator Database Schema
-- Generated: 2026-02-10
-- Target: Supabase PostgreSQL

-- ============================================
-- TABLES
-- ============================================

-- Banks (發卡銀行)
CREATE TABLE banks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    logo_url TEXT,
    website_url TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Credit Cards (信用卡)
CREATE TABLE cards (
    id SERIAL PRIMARY KEY,
    bank_id INTEGER REFERENCES banks(id),
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    card_type VARCHAR(50) NOT NULL, -- 'CASHBACK', 'MILEAGE', 'POINTS', 'HYBRID'
    annual_fee INTEGER DEFAULT 0,
    annual_fee_waiver BOOLEAN DEFAULT FALSE,
    income_requirement INTEGER,
    image_url TEXT,
    apply_url TEXT,
    features TEXT[],
    status VARCHAR(20) DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories (商戶分類)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    parent_id INTEGER REFERENCES categories(id),
    level INTEGER DEFAULT 1,
    keywords TEXT[], -- 用於自動匹配
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0
);

-- Rebate Rates (回贈率)
CREATE TABLE rebate_rates (
    id SERIAL PRIMARY KEY,
    card_id INTEGER REFERENCES cards(id),
    category_id INTEGER REFERENCES categories(id),
    rebate_type VARCHAR(50) NOT NULL, -- 'PERCENTAGE', 'FIXED', 'MULTIPLIER'
    base_rate DECIMAL(5,3) DEFAULT 0,
    bonus_rate DECIMAL(5,3) DEFAULT 0,
    cap_amount DECIMAL(10,2),
    cap_type VARCHAR(20), -- 'TRANSACTION', 'MONTHLY', 'QUARTERLY'
    min_spend DECIMAL(10,2),
    valid_from DATE,
    valid_to DATE,
    conditions TEXT[],
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mileage Programs (里數計劃)
CREATE TABLE mileage_programs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    description TEXT,
    exchange_rate DECIMAL(5,2), -- $多少換1里
    partners TEXT[], -- 合作航空公司
    status VARCHAR(20) DEFAULT 'ACTIVE'
);

-- Users (用戶)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    telegram_id VARCHAR(100) UNIQUE,
    email VARCHAR(255) UNIQUE,
    my_cards INTEGER[], -- card IDs
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Calculation History (計算記錄)
CREATE TABLE calculations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    card_id INTEGER REFERENCES cards(id),
    rebate_type VARCHAR(50),
    rebate_amount DECIMAL(10,2),
    mileage_amount DECIMAL(10,2),
    points_amount DECIMAL(10,2),
    effective_rate DECIMAL(5,3),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data Update Log (數據更新日誌)
CREATE TABLE data_update_log (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50), -- 'card', 'rate', 'bank'
    entity_id INTEGER,
    change_type VARCHAR(20), -- 'CREATE', 'UPDATE', 'DELETE'
    old_value JSONB,
    new_value JSONB,
    source VARCHAR(100), -- 'official', 'user_report', 'scraper'
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'VERIFIED', 'REJECTED'
    verified_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_cards_bank ON cards(bank_id);
CREATE INDEX idx_cards_type ON cards(card_type);
CREATE INDEX idx_cards_status ON cards(status);
CREATE INDEX idx_rebate_rates_card ON rebate_rates(card_id);
CREATE INDEX idx_rebate_rates_category ON rebate_rates(category_id);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_calculations_user ON calculations(user_id);
CREATE INDEX idx_calculations_created ON calculations(created_at);

-- ============================================
-- SAMPLE DATA (MVP - 10 張熱門卡)
-- ============================================

-- Insert Banks
INSERT INTO banks (name, name_en, logo_url, website_url) VALUES
('滙豐銀行', 'HSBC', 'https://example.com/hsbc.png', 'https://www.hsbc.com.hk'),
('渣打銀行', 'Standard Chartered', 'https://example.com/sc.png', 'https://www.standardchartered.com.hk'),
('中銀香港', 'BOCHK', 'https://example.com/bochk.png', 'https://www.bochk.com'),
('花旗銀行', 'Citi', 'https://example.com/citi.png', 'https://www.citibank.com.hk'),
('恒生銀行', 'Hang Seng', 'https://example.com/hs.png', 'https://www.hangseng.com'),
('星展銀行', 'DBS', 'https://example.com/dbs.png', 'https://www.dbs.com.hk'),
('American Express', 'American Express', 'https://example.com/amex.png', 'https://www.americanexpress.com/hk');

-- Insert Categories
INSERT INTO categories (name, name_en, level, keywords, icon) VALUES
('餐飲美食', 'Dining', 1, '['餐廳', '食飯', '外卖', 'food', 'restaurant', 'cafe']', '🍜'),
('超市購物', 'Supermarket', 1, '['超市', '便利店', 'supermarket', 'convenience']', '🏪'),
('網上購物', 'Online Shopping', 1, '['淘寶', '京東', 'Amazon', 'HKTVmall', '網購']', '🛒'),
('旅遊', 'Travel', 1, '['機票', '酒店', ' flight', 'hotel', 'travel']', '✈️'),
('外幣簽帳', 'Foreign Currency', 1, '['外幣', '海外', 'foreign', 'overseas']', '💱'),
('電訊服務', 'Telecom', 1, ['電話費', '網費', '電訊', 'mobile', 'internet']', '📱'),
('生活繳費', 'Utilities', 1, ['水電煤', '煤氣', '電費', 'utilities']', '💡'),
('娛樂', 'Entertainment', 1, ['戲院', 'Netflix', 'Disney', ' entertainment']', '🎬');

-- Insert Credit Cards (MVP - 10 張熱門卡)
INSERT INTO cards (bank_id, name, card_type, annual_fee, annual_fee_waiver, image_url, apply_url, features, status) VALUES
(1, '滙豐 Visa Signature', 'CASHBACK', 2200, FALSE, 'https://example.com/hsbc-vs.png', 'https://www.hsbc.com.hk/credit-cards/visa-signature/', ARRAY['海外5%回贈', '餐飲4%回贈'], 'ACTIVE'),
(1, '滙豐白金Visa', 'CASHBACK', 0, TRUE, 'https://example.com/hsbc-plat.png', 'https://www.hsbc.com.hk/credit-cards/platinum-visa/', ARRAY['餐飲2%', '網購2%'], 'ACTIVE'),
(2, '渣打Asia Miles', 'MILEAGE', 1800, FALSE, 'https://example.com/sc-asia.png', 'https://www.standardchartered.com.hk/sc/products/credit-cards/asia-miles/', ARRAY['海外HK$6/里', '餐飲HK$7/里'], 'ACTIVE'),
(2, '渣打Smart卡', 'CASHBACK', 0, TRUE, 'https://example.com/sc-smart.png', 'https://www.standardchartered.com.hk/sc/products/credit-cards/smart/', ARRAY['餐飲5%回贈'], 'ACTIVE'),
(3, '中銀Visa白金', 'CASHBACK', 800, TRUE, 'https://example.com/bochk-plat.png', 'https://www.bochk.com/tc/cards/visa-platinum.html', ARRAY['餐飲2%', '超市2%'], 'ACTIVE'),
(4, 'Citi Rewards', 'POINTS', 0, TRUE, 'https://example.com/citi-rewards.png', 'https://www.citibank.com.hk/credit-cards/rewards/', ARRAY['餐飲5里/里', '海外8里/$'], 'ACTIVE'),
(4, 'Citi PremierMiles', 'MILEAGE', 0, TRUE, 'https://example.com/citi-pm.png', 'https://www.citibank.com.hk/credit-cards/premiermiles/', ARRAY['海外8里/$', '本地5里/$'], 'ACTIVE'),
(5, '恒生Visa白金', 'CASHBACK', 600, TRUE, 'https://example.com/hs-plat.png', 'https://www.hangseng.com/hk/cards/visa-platinum/', ARRAY['餐飲2%', '本地2%'], 'ACTIVE'),
(6, 'DBS Compass', 'POINTS', 0, TRUE, 'https://example.com/dbs-compass.png', 'https://www.dbs.com.hk/compass-visa/', ARRAY['HK$5/里', '餐飲HK$3/里'], 'ACTIVE'),
(7, 'Amex白金', 'CASHBACK', 7800, FALSE, 'https://example.com/amex-plat.png', 'https://www.americanexpress.com/hk/en/charge-cards/platinum/', ARRAY['餐飲5%', '海外5%', '酒店5%'], 'ACTIVE');

-- Insert Rebate Rates (示例數據)
INSERT INTO rebate_rates (card_id, category_id, rebate_type, base_rate, cap_amount, cap_type, valid_from) VALUES
(1, 1, 'PERCENTAGE', 0.04, NULL, NULL, '2026-01-01'), -- 滙豐Visa Signature: 餐飲4%
(1, 2, 'PERCENTAGE', 0.02, NULL, NULL, '2026-01-01'), -- 滙豐Visa Signature: 超市2%
(1, 4, 'PERCENTAGE', 0.05, NULL, NULL, '2026-01-01'), -- 滙豐Visa Signature: 旅遊5%
(1, 5, 'PERCENTAGE', 0.05, NULL, NULL, '2026-01-01'), -- 滙豐Visa Signature: 外幣5%
(2, 1, 'PERCENTAGE', 0.02, NULL, NULL, '2026-01-01'), -- 滙豐白金: 餐飲2%
(2, 3, 'PERCENTAGE', 0.02, NULL, NULL, '2026-01-01'), -- 滙豐白金: 網購2%
(3, 1, 'MILEAGE', 0.1428, NULL, NULL, '2026-01-01'), -- 渣打Asia Miles: 餐飲 HK$7/里
(3, 5, 'MILEAGE', 0.1667, NULL, NULL, '2026-01-01'), -- 渣打Asia Miles: 外幣 HK$6/里
(4, 1, 'PERCENTAGE', 0.05, 200, 'MONTHLY', '2026-01-01'), -- 渣打Smart: 餐飲5% (月cap $200)
(5, 1, 'PERCENTAGE', 0.02, NULL, NULL, '2026-01-01'), -- 中銀白金: 餐飲2%
(5, 2, 'PERCENTAGE', 0.02, NULL, NULL, '2026-01-01'); -- 中銀白金: 超市2%

-- ============================================
-- VIEWS
-- ============================================

-- 信用卡回贈率總覽
CREATE VIEW card_rebate_overview AS
SELECT 
    c.id as card_id,
    c.name as card_name,
    b.name as bank_name,
    c.card_type,
    cat.id as category_id,
    cat.name as category_name,
    rr.base_rate,
    rr.rebate_type,
    rr.cap_amount,
    rr.cap_type
FROM cards c
JOIN banks b ON c.bank_id = b.id
JOIN rebate_rates rr ON c.id = rr.card_id
JOIN categories cat ON rr.category_id = cat.id
WHERE c.status = 'ACTIVE' AND rr.status = 'ACTIVE';

-- ============================================
-- FUNCTIONS
-- ============================================

-- 計算回贈金額
CREATE OR REPLACE FUNCTION calculate_rebate(
    p_card_id INTEGER,
    p_category_id INTEGER,
    p_amount DECIMAL(10,2)
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_rate DECIMAL(5,3);
    v_cap_amount DECIMAL(10,2);
    v_cap_type VARCHAR(20);
    v_result DECIMAL(10,2);
BEGIN
    SELECT base_rate, cap_amount, cap_type 
    INTO v_rate, v_cap_amount, v_cap_type
    FROM rebate_rates 
    WHERE card_id = p_card_id 
        AND category_id = p_category_id
        AND status = 'ACTIVE'
        AND (valid_to IS NULL OR valid_to >= CURRENT_DATE)
    LIMIT 1;
    
    IF v_rate IS NULL THEN
        RETURN 0;
    END IF;
    
    v_result := p_amount * v_rate;
    
    IF v_cap_amount IS NOT NULL THEN
        IF v_cap_type = 'TRANSACTION' THEN
            v_result := LEAST(v_result, v_cap_amount);
        END IF;
        -- MONTHLY/QUARTERLY 需要用戶會話 context，MVP 簡化處理
    END IF;
    
    RETURN ROUND(v_result, 2);
END;
$$ LANGUAGE plpgsql;
