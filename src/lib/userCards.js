// 模擬信用卡數據（未有 database 時使用）
export const mockCards = [
  { id: 1, bank_name: '滙豐', card_name: 'Visa Signature', rebate_type: 'CASHBACK', base_rate: 0.04, icon: '🏦' },
  { id: 2, bank_name: '滙豐', card_name: '白金 Visa', rebate_type: 'CASHBACK', base_rate: 0.015, icon: '🏦' },
  { id: 3, bank_name: '渣打', card_name: 'Asia Miles', rebate_type: 'MILEAGE', base_rate: 0.006, icon: '✈️' },
  { id: 4, bank_name: '渣打', card_name: 'Smart 信用卡', rebate_type: 'CASHBACK', base_rate: 0.02, icon: '🏦' },
  { id: 5, bank_name: '中銀', card_name: 'Visa 白金卡', rebate_type: 'CASHBACK', base_rate: 0.03, icon: '🏦' },
  { id: 6, bank_name: '中銀', card_name: '銀聯雙幣', rebate_type: 'CASHBACK', base_rate: 0.01, icon: '🏦' },
  { id: 7, bank_name: '恒生', card_name: 'Visa 白金卡', rebate_type: 'CASHBACK', base_rate: 0.015, icon: '🏦' },
  { id: 8, bank_name: '恒生', card_name: '優越理財白金', rebate_type: 'CASHBACK', base_rate: 0.02, icon: '🏦' },
  { id: 9, bank_name: '花旗', card_name: 'PremierMiles', rebate_type: 'MILEAGE', base_rate: 0.01, icon: '✈️' },
  { id: 10, bank_name: '花旗', card_name: 'Rewards', rebate_type: 'POINTS', base_rate: 0.01, icon: '🎁' },
  { id: 11, bank_name: '星展', card_name: 'DBS Compass', rebate_type: 'POINTS', base_rate: 0.02, icon: '🎁' },
];

// 從 localStorage 獲取用戶已選的卡片
export function getUserCards() {
  if (typeof window === 'undefined') return [];
  
  const saved = localStorage.getItem('userCards');
  if (!saved) return [];
  
  try {
    const parsed = JSON.parse(saved);
    // 確保只返回 IDs（兼容舊數據）
    return (Array.isArray(parsed) ? parsed : [])
      .map(c => (typeof c === 'object' && c !== null ? c.id : c))
      .filter(id => typeof id === 'number');
  } catch {
    return [];
  }
}

// 保存用戶已選的卡片到 localStorage
export function saveUserCards(cardIds) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('userCards', JSON.stringify(cardIds));
}

// 檢查是否為首次用戶
export function isFirstTimeUser() {
  if (typeof window === 'undefined') return true;
  return !localStorage.getItem('hasSeenCardSelector');
}

// 標記為已選擇過卡片
export function markAsSeenCardSelector() {
  if (typeof window === 'undefined') return;
  localStorage.setItem('hasSeenCardSelector', 'true');
}

// 格式化卡片名稱
export function formatCardName(card) {
  return `${card.icon} ${card.bank_name} ${card.card_name}`;
}
