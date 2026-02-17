// LocalStorage helpers for user cards

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

// 保存用戶已選的卡片到 localStorage（只保存 ID array）
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
