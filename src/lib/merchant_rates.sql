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
