-- ============================================
-- MERCHANT RATES INSERT STATEMENTS
-- Generated at: 2026-02-28T16:38:53.416Z
-- ============================================

-- First, clear existing data (optional)
-- TRUNCATE TABLE merchant_rates RESTART IDENTITY CASCADE;

-- ============================================
-- INSERT MERCHANT RATES
-- ============================================

INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  1, '麥當勞', 1, 0.04, 'PERCENTAGE', '餐飲4%回贈', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  1, '美心', 1, 0.04, 'PERCENTAGE', '餐飲4%回贈', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  1, '海底撈', 1, 0.04, 'PERCENTAGE', '餐飲4%回贈', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  1, '壽司郎', 1, 0.04, 'PERCENTAGE', '餐飲4%回贈', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  1, '牛角', 1, 0.04, 'PERCENTAGE', '餐飲4%回贈', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  1, '譚仔', 1, 0.04, 'PERCENTAGE', '餐飲4%回贈', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  1, '百佳', 2, 0.02, 'PERCENTAGE', '超市2%回贈', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  1, '惠康', 2, 0.02, 'PERCENTAGE', '超市2%回贈', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  1, 'HKTVmall', 3, 0.02, 'PERCENTAGE', '網購2%回贈', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  1, '淘寶', 3, 0.02, 'PERCENTAGE', '網購2%回贈', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  1, 'Amazon', 3, 0.02, 'PERCENTAGE', '網購2%回贈', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  1, '港鐵', 4, 0.02, 'PERCENTAGE', '交通2%回贈', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  1, 'Uber', 4, 0.02, 'PERCENTAGE', '交通2%回贈', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  1, 'Netflix', 5, 0.02, 'PERCENTAGE', '娛樂2%回贈', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  2, '7-Eleven', 1, 0.05, 'PERCENTAGE', '餐飲5% (簽賬滿HK$4,000/月)', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  2, 'OK便利店', 1, 0.05, 'PERCENTAGE', '餐飲5% (簽賬滿HK$4,000/月)', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  2, '屈臣氏', 2, 0.05, 'PERCENTAGE', '指定商戶5%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  2, '萬寧', 2, 0.05, 'PERCENTAGE', '指定商戶5%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  2, '莎莎', 2, 0.05, 'PERCENTAGE', '指定商戶5%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  2, '美心', 1, 0.05, 'PERCENTAGE', '餐飲5% (簽賬滿HK$4,000/月)', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  2, '大家樂', 1, 0.05, 'PERCENTAGE', '餐飲5% (簽賬滿HK$4,000/月)', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  2, '大快活', 1, 0.05, 'PERCENTAGE', '餐飲5% (簽賬滿HK$4,000/月)', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  3, '7-Eleven', 1, 0.05, 'PERCENTAGE', '便利店5%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  3, 'OK便利店', 1, 0.05, 'PERCENTAGE', '便利店5%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  3, '屈臣氏', 2, 0.05, 'PERCENTAGE', '屈臣氏5%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  3, '莎莎', 2, 0.05, 'PERCENTAGE', '莎莎5%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  3, 'Deliveroo', 1, 0.04, 'PERCENTAGE', '外賣4%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  3, 'Foodpanda', 1, 0.04, 'PERCENTAGE', '外賣4%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  3, '百佳', 2, 0.02, 'PERCENTAGE', '超市2%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  3, '惠康', 2, 0.02, 'PERCENTAGE', '超市2%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  4, '一田', 2, 0.06, 'PERCENTAGE', '一田6%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  4, 'AEON', 2, 0.05, 'PERCENTAGE', 'AEON 5%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  4, '百佳', 2, 0.03, 'PERCENTAGE', '超市3%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  4, '惠康', 2, 0.03, 'PERCENTAGE', '超市3%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  4, 'MK筷子', 1, 0.05, 'PERCENTAGE', '餐飲5%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  4, '海底撈', 1, 0.05, 'PERCENTAGE', '餐飲5%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  4, 'Netflix', 5, 0.03, 'PERCENTAGE', '串流3%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  4, 'Spotify', 5, 0.03, 'PERCENTAGE', '串流3%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  5, '百佳', 2, 0.04, 'PERCENTAGE', '超市4% (簽賬滿HK$1,000/月)', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  5, '惠康', 2, 0.04, 'PERCENTAGE', '超市4% (簽賬滿HK$1,000/月)', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  5, '759阿信屋', 2, 0.04, 'PERCENTAGE', '759 4%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  5, '麥當勞', 1, 0.02, 'PERCENTAGE', '餐飲2%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  5, '美心', 1, 0.02, 'PERCENTAGE', '餐飲2%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  6, '759阿信屋', 2, 0.05, 'PERCENTAGE', '759 5%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  6, '惠康', 2, 0.03, 'PERCENTAGE', '超市3%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  6, '百佳', 2, 0.03, 'PERCENTAGE', '超市3%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  6, '麥當勞', 1, 0.03, 'PERCENTAGE', '餐飲3%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  6, '港鐵', 4, 0.02, 'PERCENTAGE', '交通2%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  7, '麥當勞', 1, 0.03, 'PERCENTAGE', '餐飲3%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  7, '美心', 1, 0.03, 'PERCENTAGE', '餐飲3%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  7, '百佳', 2, 0.03, 'PERCENTAGE', '超市3%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  7, '惠康', 2, 0.03, 'PERCENTAGE', '超市3%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  7, 'HKTVmall', 3, 0.03, 'PERCENTAGE', '網購3%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  7, 'Amazon', 3, 0.03, 'PERCENTAGE', '網購3%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  7, '港鐵', 4, 0.01, 'PERCENTAGE', '交通1%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  7, '巴士', 4, 0.01, 'PERCENTAGE', '交通1%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  8, '麥當勞', 1, 0.01, 'PERCENTAGE', '餐飲1%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  8, '百佳', 2, 0.01, 'PERCENTAGE', '超市1%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  8, 'HKTVmall', 3, 0.02, 'PERCENTAGE', '網購2% (簽賬滿HK$5,000/月)', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  8, '淘寶', 3, 0.02, 'PERCENTAGE', '網購2% (簽賬滿HK$5,000/月)', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  8, 'Deliveroo', 1, 0.01, 'PERCENTAGE', '外賣1%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  9, '麥當勞', 1, 0.01, 'PERCENTAGE', '餐飲1%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  9, '百佳', 2, 0.01, 'PERCENTAGE', '超市1%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  9, 'HKTVmall', 3, 0.01, 'PERCENTAGE', '網購1%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  9, 'Netflix', 5, 0.01, 'PERCENTAGE', '娛樂1%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  10, '壽司郎', 1, 0.05, 'PERCENTAGE', '餐飲5%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  10, '海底撈', 1, 0.05, 'PERCENTAGE', '餐飲5%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  10, '美心', 1, 0.05, 'PERCENTAGE', '餐飲5%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  10, '百佳', 2, 0.03, 'PERCENTAGE', '超市3%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  10, 'HKTVmall', 3, 0.05, 'PERCENTAGE', '網購5%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  10, 'Amazon', 3, 0.05, 'PERCENTAGE', '網購5%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  10, 'Netflix', 5, 0.05, 'PERCENTAGE', '娛樂5%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  10, 'Uber', 4, 0.05, 'PERCENTAGE', '交通5%', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  11, '國泰機票', 4, 0.015, 'MILEAGE', 'HK$8/里', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  11, '酒店', 4, 0.015, 'MILEAGE', 'HK$8/里', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  11, 'Uber', 4, 0.0125, 'MILEAGE', 'HK$12/里', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  11, 'Deliveroo', 1, 0.01, 'MILEAGE', 'HK$15/里', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  12, '國泰機票', 4, 0.015, 'MILEAGE', 'HK$6/里', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  12, '酒店', 4, 0.015, 'MILEAGE', 'HK$7/里', 'ACTIVE'
);
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (
  12, 'Uber', 4, 0.01, 'MILEAGE', 'HK$12/里', 'ACTIVE'
);

-- ============================================
-- Total records: 80
-- ============================================
