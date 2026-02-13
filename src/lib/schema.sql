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

-- Insert Categories (8 categories matching frontend)
INSERT INTO categories (name, name_en, level, keywords, icon, sort_order) VALUES
('餐飲美食', 'Dining', 1, ARRAY['餐廳', '食飯', '外賣', 'food', 'restaurant', 'cafe', '壽司郎', '麥當勞'], '🍜', 1),
('網上購物', 'Online Shopping', 1, ARRAY['淘寶', '京東', 'Amazon', 'HKTVmall', '網購', '網上購物', 'shopee', 'lazada'], '🛒', 2),
('超市便利店', 'Supermarket', 1, ARRAY['超市', '便利店', '百佳', '惠康', '759', '7-11', 'OK便利店'], '🏪', 3),
('交通出行', 'Transport', 1, ARRAY['Uber', '的士', '港鐵', 'MTR', '交通', '出行', '車費'], '🚗', 4),
('娛樂休閒', 'Entertainment', 1, ARRAY['戲院', 'Netflix', 'Disney', '娛樂', ' cinema', ' entertainment'], '🎬', 5),
('旅遊外遊', 'Travel', 1, ARRAY['機票', '酒店', '旅遊', 'flight', 'hotel', 'travel', '國泰'], '✈️', 6),
('服飾美容', 'Fashion', 1, ARRAY['Uniqlo', 'Zara', 'H&M', '服飾', '美容', '化妝', '衣服'], '👗', 7),
('公用事業', 'Utilities', 1, ARRAY['水電煤', '電費', '煤氣', '電話費', '寬頻', '公用事業'], '💡', 8);

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
(1, 2, 'PERCENTAGE', 0.02, NULL, NULL, '2026-01-01'), -- 滙豐Visa Signature: 網上購物2%
(1, 3, 'PERCENTAGE', 0.02, NULL, NULL, '2026-01-01'), -- 滙豐Visa Signature: 超市便利店2%
(1, 6, 'PERCENTAGE', 0.05, NULL, NULL, '2026-01-01'), -- 滙豐Visa Signature: 旅遊外遊5%
(1, 7, 'PERCENTAGE', 0.05, NULL, NULL, '2026-01-01'), -- 滙豐Visa Signature: 外幣5%
(2, 1, 'PERCENTAGE', 0.02, NULL, NULL, '2026-01-01'), -- 滙豐白金: 餐飲2%
(2, 2, 'PERCENTAGE', 0.02, NULL, NULL, '2026-01-01'), -- 滙豐白金: 網上購物2%
(3, 1, 'MILEAGE', 0.1428, NULL, NULL, '2026-01-01'), -- 渣打Asia Miles: 餐飲 HK$7/里
(3, 6, 'MILEAGE', 0.1667, NULL, NULL, '2026-01-01'), -- 渣打Asia Miles: 旅遊 HK$6/里
(4, 1, 'PERCENTAGE', 0.05, 200, 'MONTHLY', '2026-01-01'), -- 渣打Smart: 餐飲5% (月cap $200)
(5, 1, 'PERCENTAGE', 0.02, NULL, NULL, '2026-01-01'), -- 中銀白金: 餐飲2%
(5, 3, 'PERCENTAGE', 0.02, NULL, NULL, '2026-01-01'), -- 中銀白金: 超市便利店2%
(9, 1, 'POINTS', 0.02, NULL, NULL, '2026-01-01'), -- DBS Compass: 餐飲2%
(9, 3, 'POINTS', 0.01, NULL, NULL, '2026-01-01'); -- DBS Compass: 超市便利店1%

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
    END IF;
    
    RETURN ROUND(v_result, 2);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- END OF SCHEMA
-- ============================================
-- ============================================
-- MERCHANT RATES TABLE
-- 每張卡喺唔同商戶嘅特定回贈率
-- ============================================

CREATE TABLE merchant_rates (
    id SERIAL PRIMARY KEY,
    card_id INTEGER REFERENCES cards(id),
    merchant_name VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    rebate_rate DECIMAL(5,3) NOT NULL,
    rebate_type VARCHAR(50) DEFAULT 'PERCENTAGE',
    conditions TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX idx_merchant_rates_card ON merchant_rates(card_id);
CREATE INDEX idx_merchant_rates_merchant ON merchant_rates(merchant_name);
CREATE INDEX idx_merchant_rates_category ON merchant_rates(category_id);

-- ============================================
-- SAMPLE MERCHANT RATES
-- ============================================

-- 滙豐 Visa Signature (card_id = 1)
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, conditions) VALUES
(1, '壽司郎', 1, 0.04, '餐飲4%'),
(1, '壽司郎', 1, 0.04, NULL),
(1, '麥當勞', 1, 0.04, '快餐4%'),
(1, '海底撈', 1, 0.04, '火鍋4%'),
(1, '牛角', 1, 0.04, '燒肉4%'),
(1, '譚仔', 1, 0.04, '米線4%'),
(1, '茶餐廳', 1, 0.04, '一般餐廳4%'),
(1, '百佳', 3, 0.02, '超市2%'),
(1, '惠康', 3, 0.02, '超市2%'),
(1, '淘寶', 2, 0.02, '網購2%'),
(1, '京東', 2, 0.02, '網購2%'),
(1, 'Amazon', 2, 0.02, '網購2%'),
(1, 'Uber', 4, 0.02, '交通2%'),
(1, 'Netflix', 5, 0.02, '娛樂2%');

-- 滙豐白金Visa (card_id = 2)
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, conditions) VALUES
(2, '壽司郎', 1, 0.02, '餐飲2%'),
(2, '麥當勞', 1, 0.02, '快餐2%'),
(2, '百佳', 3, 0.02, '超市2%'),
(2, '淘寶', 2, 0.02, '網購2%'),
(2, '京東', 2, 0.02, '網購2%');

-- 渣打Asia Miles (card_id = 3)
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions) VALUES
(3, '壽司郎', 1, 0.1428, 'MILEAGE', 'HK$7/里'),
(3, '國泰機票', 6, 0.1667, 'MILEAGE', 'HK$6/里'),
(3, '酒店', 6, 0.1428, 'MILEAGE', 'HK$7/里'),
(3, 'Uber', 4, 0.0833, 'MILEAGE', 'HK$12/里');

-- 渣打Smart卡 (card_id = 4)
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, conditions) VALUES
(4, '壽司郎', 1, 0.05, '餐飲5% (月cap $200)'),
(4, '麥當勞', 1, 0.05, '快餐5% (月cap $200)'),
(4, '海底撈', 1, 0.05, '火鍋5% (月cap $200)'),
(4, '百佳', 3, 0.02, '超市2%'),
(4, '惠康', 3, 0.02, '超市2%');

-- 中銀Visa白金 (card_id = 5)
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, conditions) VALUES
(5, '壽司郎', 1, 0.02, '餐飲2%'),
(5, '百佳', 3, 0.02, '超市2%'),
(5, '惠康', 3, 0.02, '超市2%'),
(5, '759', 3, 0.02, '便利店2%');

-- Citi Rewards (card_id = 6)
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions) VALUES
(6, '壽司郎', 1, 0.01, 'POINTS', 'HK$5/積分'),
(6, '麥當勞', 1, 0.01, 'POINTS', 'HK$5/積分'),
(6, '淘寶', 2, 0.01, 'POINTS', 'HK$5/積分'),
(6, 'Netflix', 5, 0.01, 'POINTS', 'HK$5/積分');

-- Citi PremierMiles (card_id = 7)
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions) VALUES
(7, '國泰機票', 6, 0.125, 'MILEAGE', 'HK$8/里'),
(7, '酒店', 6, 0.125, 'MILEAGE', 'HK$8/里'),
(7, 'Uber', 4, 0.0833, 'MILEAGE', 'HK$12/里');

-- 恒生Visa白金 (card_id = 8)
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, conditions) VALUES
(8, '壽司郎', 1, 0.02, '餐飲2%'),
(8, '百佳', 3, 0.02, '超市2%'),
(8, '惠康', 3, 0.02, '超市2%');

-- DBS Compass (card_id = 9)
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions) VALUES
(9, '壽司郎', 1, 0.03, 'POINTS', 'HK$3.3/積分'),
(9, '百佳', 3, 0.01, 'POINTS', 'HK$10/積分'),
(9, '淘寶', 2, 0.015, 'POINTS', 'HK$6.7/積分'),
(9, 'Netflix', 5, 0.02, 'POINTS', 'HK$5/積分');

-- Amex白金 (card_id = 10)
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, conditions) VALUES
(10, '壽司郎', 1, 0.05, '餐飲5%'),
(10, '麥當勞', 1, 0.05, '快餐5%'),
(10, '百佳', 3, 0.03, '超市3%'),
(10, '淘寶', 2, 0.05, '網購5%'),
(10, 'Netflix', 5, 0.05, '娛樂5%'),
(10, 'Uber', 4, 0.05, '交通5%');

-- ============================================
-- FUNCTION: GET MERCHANT RATES FOR CARDS
-- ============================================

CREATE OR REPLACE FUNCTION get_merchant_rates_for_cards(
    p_card_ids INTEGER[],
    p_category_id INTEGER
)
RETURNS TABLE (
    merchant_name VARCHAR(255),
    category_id INTEGER,
    card_id INTEGER,
    card_name VARCHAR(255),
    bank_name VARCHAR(100),
    rebate_rate DECIMAL(5,3),
    rebate_type VARCHAR(50),
    conditions TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mr.merchant_name,
        mr.category_id,
        c.id as card_id,
        c.name as card_name,
        b.name as bank_name,
        mr.rebate_rate,
        mr.rebate_type,
        mr.conditions
    FROM merchant_rates mr
    JOIN cards c ON mr.card_id = c.id
    JOIN banks b ON c.bank_id = b.id
    WHERE mr.card_id = ANY(p_card_ids)
        AND mr.category_id = p_category_id
        AND mr.status = 'ACTIVE'
        AND c.status = 'ACTIVE'
    ORDER BY mr.merchant_name, c.name;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- END OF MERCHANT RATES
-- ============================================
