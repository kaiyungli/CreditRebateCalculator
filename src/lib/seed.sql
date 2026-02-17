-- Seed Data for Credit Card Rebate Calculator
-- 測試用範例數據

-- ============================================
-- BANKS (銀行)
-- ============================================
INSERT INTO banks (id, name, logo_url, website, status) VALUES
(1, '滙豐銀行', 'https://www.hsbc.com.hk/content/dam/hsbc/hk/images/logo-hsbc.svg', 'https://www.hsbc.com.hk/credit-cards/', 'ACTIVE'),
(2, '渣打銀行', 'https://www.sc.com/hk/zh/logos/sc-logo.svg', 'https://www.sc.com/hk/zh/credit-cards/', 'ACTIVE'),
(3, '中國銀行', 'https://www.bochk.com/content/dam/boc/hk/images/logo.svg', 'https://www.bochk.com/sc/personal/cards/credit-cards/', 'ACTIVE'),
(4, '恒生銀行', 'https://www.hangseng.com/content/dam/hangseng/images/logo.svg', 'https://www.hangseng.com/hk/zh/personal-banking/credit-cards/', 'ACTIVE'),
(5, '花旗銀行', 'https://www.citi.com/graphicshare/gce/citi-logo.svg', 'https://www.citibank.com.hk/solutions/credit-cards/', 'ACTIVE'),
(6, '星展銀行', 'https://www.dbs.com.hk/content/dam/dbs/hk/images/logo.svg', 'https://www.dbs.com.hk/personal-banking/cards/credit-cards/default.page', 'ACTIVE');

-- ============================================
-- CATEGORIES (商戶分類)
-- ============================================
INSERT INTO categories (id, name, icon, parent_id, description, sort_order) VALUES
(1, '餐飲美食', '🍜', NULL, '餐廳、咖啡店、外賣', 1),
(2, '網上購物', '🛒', NULL, '網上平台購物', 2),
(3, '超市便利店', '🏪', NULL, '超市、便利店消費', 3),
(4, '交通出行', '🚗', NULL, '交通、燃油、停車', 4),
(5, '娛樂休閒', '🎬', NULL, '電影、遊戲、娛樂', 5),
(6, '服飾美容', '👗', NULL, '服裝、化妝品、護膚', 6),
(3, '旅遊外遊', '✈️', NULL, '機票、酒店、外遊消費', 6),
(8, '水電煤氣', '💡', NULL, '公用事業繳費', 7),
(9, '其他消費', '💳', NULL, '其他一般消費', 8);

-- ============================================
-- CARDS (信用卡)
-- ============================================

-- 滙豐銀行
INSERT INTO cards (id, bank_id, name, card_type, annual_fee, annual_fee_waiver, 
                  income_required, foreign_currency_rate, image_url, apply_url, 
                  features, status, created_at) VALUES
(1, 1, 'Visa Signature', 'CASHBACK', 0, true, 120000, 0, '', 'https://www.hsbc.com.hk/credit-cards/visa-signature/', 
 '["4% 餐飲回贈", "2% 其他消費", "尊貴禮遇"]', 'ACTIVE', NOW()),
(2, 1, '白金 Visa 卡', 'CASHBACK', 0, true, 0, 0, '', 'https://www.hsbc.com.hk/credit-cards/visa-platinum/',
 '["1.5% 現金回贈", "全年有效", "免年費"]', 'ACTIVE', NOW()),

-- 渣打銀行
(3, 2, 'Asia Miles 信用卡', 'MILEAGE', 1800, false, 240000, 0, '', 'https://www.sc.com/hk/zh/credit-cards/asia-miles/',
 '["HK$6/里", "里數永不过期", "機場貴賓室"]', 'ACTIVE', NOW()),
(4, 2, 'Smart 信用卡', 'CASHBACK', 0, true, 0, 0, '', 'https://www.sc.com/hk/zh/credit-cards/smart/',
 '["2% 現金回贈", "HK$6里/外幣", "自動兌換"]', 'ACTIVE', NOW()),

-- 中國銀行
(5, 3, 'Visa 白金卡', 'CASHBACK', 0, true, 0, 0, '', 'https://www.bochk.com/sc/personal/cards/credit-cards/visa-platinum/',
 '["2% 現金回贈", "餐飲3%", "網上4%"]', 'ACTIVE', NOW()),
(6, 3, '銀聯雙幣信用卡', 'CASHBACK', 0, true, 0, 0, '', 'https://www.bochk.com/sc/personal/cards/credit-cards/unionpay/',
 '["1% 港幣回贈", "0.5% 人民幤回贈", "跨境消費优惠"]', 'ACTIVE', NOW()),

-- 恒生銀行
(7, 4, 'Visa 白金卡', 'CASHBACK', 0, true, 0, 0, '', 'https://www.hangseng.com/hk/zh/personal-banking/credit-cards/visa-platinum/',
 '["1.5% Cash Dollars", "餐飲3%", "全年積分"]', 'ACTIVE', NOW()),
(8, 4, '優越理財白金卡', 'CASHBACK', 0, true, 600000, 0, '', 'https://www.hangseng.com/hk/zh/personal-banking/credit-cards/premium/',
 '["2% Cash Dollars", "旅遊獎賞", "免費旅遊保險"]', 'ACTIVE', NOW()),

-- 花旗銀行
(9, 5, 'PremierMiles 信用卡', 'MILEAGE', 1800, false, 360000, 0, '', 'https://www.citibank.com.hk/solutions/credit-cards/premiermiles/',
 '["HK$8/里", "無限次機場貴賓室", "旅行保障"]', 'ACTIVE', NOW()),
(10, 5, 'Rewards 信用卡', 'POINTS', 400, false, 120000, 0, '', 'https://www.citibank.com.hk/solutions/credit-cards/rewards/',
 '["積分兌換禮品", "HK$1/積分", "積分轉讓"]', 'ACTIVE', NOW()),

-- 星展銀行
(11, 6, 'DBS Compass Visa', 'POINTS', 0, true, 0, 0, '', 'https://www.dbs.com.hk/personal-banking/cards/credit-cards/dbs-compass-visa/',
 '["HK$5/積分", "餐飲6%", "積分兌換"]', 'ACTIVE', NOW());

-- ============================================
-- REBATE RATES (回贈率)
-- ============================================

-- 滙豐 Visa Signature
INSERT INTO rebate_rates (card_id, category_id, rebate_type, base_rate, cap_amount, cap_type, 
                         min_spend, bonus_rate, bonus_condition, valid_from, status) VALUES
(1, 1, 'CASHBACK', 0.04, NULL, NULL, NULL, NULL, NULL, NOW(), 'ACTIVE'),  -- 餐飲 4%
(1, 2, 'CASHBACK', 0.02, NULL, NULL, NULL, NULL, NULL, NOW(), 'ACTIVE'),  -- 網上購物 2%
(1, 3, 'CASHBACK', 0.02, NULL, NULL, NULL, NULL, NULL, NOW(), 'ACTIVE'),  -- 超市 2%
(1, 9, 'CASHBACK', 0.02, NULL, NULL, NULL, NULL, NULL, NOW(), 'ACTIVE');  -- 其他 2%

-- 滙豐白金
INSERT INTO rebate_rates (card_id, category_id, rebate_type, base_rate, cap_amount, cap_type, 
                         min_spend, bonus_rate, bonus_condition, valid_from, status) VALUES
(2, 1, 'CASHBACK', 0.015, NULL, NULL, NULL, NULL, NULL, NOW(), 'ACTIVE'),  -- 餐飲 1.5%
(2, 9, 'CASHBACK', 0.015, NULL, NULL, NULL, NULL, NULL, NOW(), 'ACTIVE');  -- 其他 1.5%

-- 渣打 Asia Miles
INSERT INTO rebate_rates (card_id, category_id, rebate_type, base_rate, cap_amount, cap_type, 
                         min_spend, bonus_rate, bonus_condition, valid_from, status) VALUES
(3, 1, 'MILEAGE', 0.006, NULL, NULL, NULL, NULL, NULL, NOW(), 'ACTIVE'),   -- 餐飲 HK$6/里
(3, 2, 'MILEAGE', 0.006, NULL, NULL, NULL, NULL, NULL, NOW(), 'ACTIVE'),   -- 網上 HK$6/里
(3, 7, 'MILEAGE', 0.01, NULL, NULL, NULL, NULL, NULL, NOW(), 'ACTIVE');    -- 旅遊 HK$4/里

-- 渣打 Smart
INSERT INTO rebate_rates (card_id, category_id, rebate_type, base_rate, cap_amount, cap_type, 
                         min_spend, bonus_rate, bonus_condition, valid_from, status) VALUES
(4, 1, 'CASHBACK', 0.02, NULL, NULL, NULL, NULL, NULL, NOW(), 'ACTIVE'),   -- 餐飲 2%
(4, 2, 'CASHBACK', 0.02, NULL, NULL, NULL, NULL, NULL, NOW(), 'ACTIVE'),  -- 網上 2%
(4, 3, 'CASHBACK', 0.02, NULL, NULL, NULL, NULL, NULL, NOW(), 'ACTIVE'),  -- 超市 2%
(4, 9, 'CASHBACK', 0.015, NULL, NULL, NULL, NULL, NULL, NOW(), 'ACTIVE'); -- 其他 1.5%

-- 中銀 Visa 白金
INSERT INTO rebate_rates (card_id, category_id, rebate_type, base_rate, cap_amount, cap_type, 
                         min_spend, bonus_rate, bonus_condition, valid_from, status) VALUES
(5, 1, 'CASHBACK', 0.03, NULL, NULL, NULL, NULL, NULL, NOW(), 'ACTIVE'),   -- 餐飲 3%
(5, 2, 'CASHBACK', 0.04, NULL, NULL, NULL, NULL, NULL, NOW(), 'ACTIVE'),    -- 網上 4%
(5, 3, 'CASHBACK', 0.02, NULL, NULL, NULL, NULL, NULL, NOW(), 'ACTIVE'),  -- 超市 2%
(5, 9, 'CASHBACK', 0.01, NULL, NULL, NULL, NULL, NULL, NOW(), 'ACTIVE');   -- 其他 1%

-- 恒生 Visa 白金
INSERT INTO rebate_rates (card_id, category_id, rebate_type, base_rate, cap_amount, cap_type, 
                         min_spend, bonus_rate, bonus_condition, valid_from, status) VALUES
(7, 1, 'CASHBACK', 0.03, NULL, NULL, NULL, NULL, NULL, NOW(), 'ACTIVE'),  -- 餐飲 3%
(7, 3, 'CASHBACK', 0.02, NULL, NULL, NULL, NULL, NULL, NOW(), 'ACTIVE'),  -- 超市 2%
(7, 9, 'CASHBACK', 0.015, NULL, NULL, NULL, NULL, NULL, NOW(), 'ACTIVE'); -- 其他 1.5%

-- 花旗 PremierMiles
INSERT INTO rebate_rates (card_id, category_id, rebate_type, base_rate, cap_amount, cap_type, 
                         min_spend, bonus_rate, bonus_condition, valid_from, status) VALUES
(9, 7, 'MILEAGE', 0.01, NULL, NULL, NULL, NULL, NULL, NOW(), 'ACTIVE'),    -- 旅遊 HK$4/里
(9, 1, 'MILEAGE', 0.006, NULL, NULL, NULL, NULL, NULL, NOW(), 'ACTIVE'),   -- 餐飲 HK$6/里
(9, 2, 'MILEAGE', 0.006, NULL, NULL, NULL, NULL, NULL, NOW(), 'ACTIVE');   -- 網上 HK$6/里

-- DBS Compass
INSERT INTO rebate_rates (card_id, category_id, rebate_type, base_rate, cap_amount, cap_type, 
                         min_spend, bonus_rate, bonus_condition, valid_from, status) VALUES
(11, 1, 'POINTS', 0.02, NULL, NULL, NULL, NULL, NULL, NOW(), 'ACTIVE'),   -- 餐飲 HK$5/分
(11, 2, 'POINTS', 0.015, NULL, NULL, NULL, NULL, NULL, NOW(), 'ACTIVE'),   -- 網上 HK$6.7/分
(11, 3, 'POINTS', 0.01, NULL, NULL, NULL, NULL, NULL, NOW(), 'ACTIVE');    -- 超市 HK$10/分

-- ============================================
-- SAMPLE USERS (測試用戶)
-- ============================================
INSERT INTO users (telegram_id, name, my_cards, preferences) VALUES
(123456789, '測試用戶', '[1, 3, 5]', '{"notifications": true, "preferred_type": "CASHBACK"}');

-- ============================================
-- SAMPLE CALCULATIONS (計算記錄)
-- ============================================
INSERT INTO calculations (user_id, amount, category_id, card_id, rebate_type, rebate_amount, effective_rate) VALUES
(1, 500, 1, 1, 'CASHBACK', 20, 0.04),
(1, 1000, 2, 5, 'CASHBACK', 40, 0.04),
(1, 300, 3, 4, 'CASHBACK', 6, 0.02);

-- ============================================
-- MERCHANT RATES (商戶回贈率)
-- ============================================
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES
-- 滙豐 Visa Signature
(1, '壽司郎', 1, 0.04, 'CASHBACK', '餐飲4%', 'ACTIVE'),
(1, '麥當勞', 1, 0.04, 'CASHBACK', '快餐4%', 'ACTIVE'),
(1, '海底撈', 1, 0.04, 'CASHBACK', '火鍋4%', 'ACTIVE'),
(1, '淘寶', 2, 0.02, 'CASHBACK', '網上2%', 'ACTIVE'),
(1, 'Amazon', 2, 0.02, 'CASHBACK', '海外網購2%', 'ACTIVE'),
(1, '百佳', 3, 0.02, 'CASHBACK', '超市2%', 'ACTIVE'),

-- 渣打 Asia Miles
(3, '國泰航空', 7, 0.01, 'MILEAGE', 'HK$4/里(旅遊)', 'ACTIVE'),
(3, '壽司郎', 1, 0.006, 'MILEAGE', 'HK$6/里', 'ACTIVE'),
(3, '麥當勞', 1, 0.006, 'MILEAGE', 'HK$6/里', 'ACTIVE'),

-- 中銀 Visa 白金
(5, '淘寶', 2, 0.04, 'CASHBACK', '網上4%', 'ACTIVE'),
(5, '天貓', 2, 0.04, 'CASHBACK', '網上4%', 'ACTIVE'),
(5, '淘寶HK', 2, 0.04, 'CASHBACK', '網上4%', 'ACTIVE'),
(5, '壽司郎', 1, 0.03, 'CASHBACK', '餐飲3%', 'ACTIVE'),
(5, '麥當勞', 1, 0.03, 'CASHBACK', '快餐3%', 'ACTIVE'),

-- DBS Compass
(11, '壽司郎', 1, 0.06, 'POINTS', 'HK$5/分(餐飲6%)', 'ACTIVE'),
(11, '海底撈', 1, 0.06, 'POINTS', 'HK$5/分(餐飲6%)', 'ACTIVE'),
(11, '淘寶', 2, 0.015, 'POINTS', 'HK$6.7/分', 'ACTIVE'),
(11, '百佳', 3, 0.01, 'POINTS', 'HK$10/分', 'ACTIVE'),
(11, '惠康', 3, 0.01, 'POINTS', 'HK$10/分', 'ACTIVE');

PRINT '✅ Seed data inserted successfully!';
PRINT 'Total Banks: 6';
PRINT 'Total Categories: 9';
PRINT 'Total Cards: 11';
