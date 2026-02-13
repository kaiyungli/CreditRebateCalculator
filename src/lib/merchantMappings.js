// 商戶名稱映射表
// 輸入商戶名稱 → 自動對應商戶類別

export const merchantMappings = {
  // 🍣 壽司/日本料理
  '壽司郎': { category: '餐飲美食', icon: '🍣', keywords: ['壽司郎', 'sushiro', 'SUSHIRO'] },
  '魚屋': { category: '餐飲美食', icon: '🍣', keywords: ['魚屋', '魚屋'] },
  '板長': { category: '餐飲美食', icon: '🍣', keywords: ['板長', '板長壽司'] },
  '元氣': { category: '餐飲美食', icon: '🍣', keywords: ['元氣', '元気'] },
  '爭鮮': { category: '餐飲美食', icon: '🍣', keywords: ['爭鮮', '爭鮮迴轉壽司'] },
  '牛角': { category: '餐飲美食', icon: '🍖', keywords: ['牛角', '牛角燒肉'] },
  '牛扒': { category: '餐飲美食', icon: '🥩', keywords: ['牛扒', '牛排', 'steak'] },
  '燒肉': { category: '餐飲美食', icon: '🍖', keywords: ['燒肉', '烤肉', 'yakiniku'] },
  '火鍋': { category: '餐飲美食', icon: '🍲', keywords: ['火鍋', 'hotpot', '涮涮鍋'] },
  '海底撈': { category: '餐飲美食', icon: '🍲', keywords: ['海底撈'] },
  '譚仔': { category: '餐飲美食', icon: '🍜', keywords: ['譚仔', '譚仔三哥', '譚仔雲南米線'] },
  '譚仔米線': { category: '餐飲美食', icon: '🍜', keywords: ['譚仔', '譚仔三哥', '譚仔雲南米線'] },
  
  // 🍔 快餐/連鎖
  '麥當勞': { category: '餐飲美食', icon: '🍔', keywords: ['麥當勞', 'mcdonald', 'McDonald'] },
  'MCD': { category: '餐飲美食', icon: '🍔', keywords: ['麥當勞', 'mcdonald', 'McDonald'] },
  '肯德基': { category: '餐飲美食', icon: '🍗', keywords: ['肯德基', 'KFC', 'kfc'] },
  'Burger King': { category: '餐飲美食', icon: '🍔', keywords: ['burger king', 'Burger King', '漢堡王'] },
  'Subway': { category: '餐飲美食', icon: '🥪', keywords: ['subway', 'Subway', '賽百味'] },
  '大家樂': { category: '餐飲美食', icon: '🍚', keywords: ['大家樂', 'Cafe de Coral'] },
  '大快活': { category: '餐飲美食', icon: '🍚', keywords: ['大快活', 'Fairwood'] },
  '美心': { category: '餐飲美食', icon: '🍚', keywords: ['美心', 'MX', 'Maxim'] },
  
  // 🍜 粉麵/粥品
  '粥品': { category: '餐飲美食', icon: '🥣', keywords: ['粥', '粥品', '生滾粥'] },
  '雲南米線': { category: '餐飲美食', icon: '🍜', keywords: ['雲南米線', '過橋米線'] },
  '越南河粉': { category: '餐飲美食', icon: '🍜', keywords: ['越南河粉', 'pho', '河粉'] },
  '拉麵': { category: '餐飲美食', icon: '🍜', keywords: ['拉麵', 'ramen', '豚骨'] },
  
  // 🍵 茶餐廳/咖啡
  '茶餐廳': { category: '餐飲美食', icon: '☕', keywords: ['茶餐廳', '茶記'] },
  '冰室': { category: '餐飲美食', icon: '☕', keywords: ['冰室', '茶餐廳'] },
  '太平洋咖啡': { category: '餐飲美食', icon: '☕', keywords: ['太平洋咖啡', 'Pacific Coffee'] },
  '星巴克': { category: '餐飲美食', icon: '☕', keywords: ['星巴克', 'Starbucks', 'starbucks'] },
  'Starbucks': { category: '餐飲美食', icon: '☕', keywords: ['星巴克', 'Starbucks'] },
  'Blue Bottle': { category: '餐飲美食', icon: '☕', keywords: ['Blue Bottle', '藍瓶'] },
  
  // 🏪 超市/便利店
  '百佳': { category: '超市便利店', icon: '🛒', keywords: ['百佳', 'PARKnSHOP', 'parknshop'] },
  '惠康': { category: '超市便利店', icon: '🛒', keywords: ['惠康', 'Wellcome'] },
  '759': { category: '超市便利店', icon: '🏪', keywords: ['759', '759阿信屋'] },
  '華潤': { category: '超市便利店', icon: '🛒', keywords: ['華潤', 'CR Vanguard'] },
  '7-11': { category: '超市便利店', icon: '🏪', keywords: ['7-11', '7Eleven', 'seven eleven'] },
  'OK便利店': { category: '超市便利店', icon: '🏪', keywords: ['OK', 'OK便利店', 'Circle K'] },
  'Circle K': { category: '超市便利店', icon: '🏪', keywords: ['OK', 'Circle K'] },
  '惠康': { category: '超市便利店', icon: '🛒', keywords: ['惠康', 'Wellcome'] },
  
  // 🛍️ 網上購物
  '淘寶': { category: '網上購物', icon: '🛍️', keywords: ['淘寶', 'Taobao', '淘寶網'] },
  '天貓': { category: '網上購物', icon: '🛍️', keywords: ['天貓', 'Tmall'] },
  '京東': { category: '網上購物', icon: '📦', keywords: ['京東', 'JD', 'jd.com'] },
  'Amazon': { category: '網上購物', icon: '📦', keywords: ['amazon', 'Amazon', '亞馬遜'] },
  'Amazon HK': { category: '網上購物', icon: '📦', keywords: ['amazon hk', 'Amazon HK'] },
  'Shopee': { category: '網上購物', icon: '🛍️', keywords: ['shopee', 'Shopee', '蝦皮'] },
  'Lazada': { category: '網上購物', icon: '🛍️', keywords: ['lazada', 'Lazada'] },
  'eBay': { category: '網上購物', icon: '📦', keywords: ['ebay', 'eBay'] },
  
  // 🚗 交通出行
  'Uber': { category: '交通出行', icon: '🚗', keywords: ['uber', 'Uber'] },
  'UberEats': { category: '餐飲美食', icon: '🍔', keywords: ['ubereats', 'UberEats'] },
  'Lyft': { category: '交通出行', icon: '🚗', keywords: ['lyft', 'Lyft'] },
  '的士': { category: '交通出行', icon: '🚕', keywords: ['的士', 'taxi', ' cab'] },
  '港鐵': { category: '交通出行', icon: '🚇', keywords: ['港鐵', 'MTR', 'mtr'] },
  'MTR': { category: '交通出行', icon: '🚇', keywords: ['港鐵', 'MTR'] },
  'Uber': { category: '交通出行', icon: '🚗', keywords: ['uber', 'Uber'] },
  'Call4Van': { category: '交通出行', icon: '🚐', keywords: ['call4van', 'Call4Van', '客貨車'] },
  
  // 🍔 外賣平台
  'Foodpanda': { category: '餐飲美食', icon: '🍔', keywords: ['foodpanda', 'Foodpanda', '熊貓外賣'] },
  'Deliveroo': { category: '餐飲美食', icon: '🍔', keywords: ['deliveroo', 'Deliveroo', '戶戶送'] },
  '户户送': { category: '餐飲美食', icon: '🍔', keywords: ['deliveroo', 'Deliveroo', '户户送'] },
  
  // 🎬 娛樂休閒
  'Cinema': { category: '娛樂休閒', icon: '🎬', keywords: ['cinema', 'Cinema', '戲院'] },
  '百老匯': { category: '娛樂休閒', icon: '🎬', keywords: ['百老匯', 'Broadway', '百老匯戲院'] },
  'MCL': { category: '娛樂休閒', icon: '🎬', keywords: ['MCL', 'mcl', 'MCL戲院'] },
  'UA': { category: '娛樂休閒', icon: '🎬', keywords: ['UA', 'ua', 'UA戲院'] },
  'Netflix': { category: '娛樂休閒', icon: '📺', keywords: ['netflix', 'Netflix'] },
  'Disney+': { category: '娛樂休閒', icon: '🎬', keywords: ['disney', 'Disney+', 'Disney Plus'] },
  'Disney Plus': { category: '娛樂休閒', icon: '🎬', keywords: ['disney', 'Disney+', 'Disney Plus'] },
  'Spotify': { category: '娛樂休閒', icon: '🎵', keywords: ['spotify', 'Spotify'] },
  'YouTube': { category: '娛樂休閒', icon: '📺', keywords: ['youtube', 'YouTube'] },
  'KTV': { category: '娛樂休閒', icon: '🎤', keywords: ['KTV', 'ktv', '卡拉OK'] },
  
  // ✈️ 旅遊
  '國泰': { category: '旅遊外遊', icon: '✈️', keywords: ['國泰', 'Cathay', 'cathay pacific'] },
  'Cathay': { category: '旅遊外遊', icon: '✈️', keywords: ['國泰', 'Cathay'] },
  '香港航空': { category: '旅遊外遊', icon: '✈️', keywords: ['香港航空', 'HK Express'] },
  'HK Express': { category: '旅遊外遊', icon: '✈️', keywords: ['hk express', 'HK Express'] },
  'Agoda': { category: '旅遊外遊', icon: '🏨', keywords: ['agoda', 'Agoda'] },
  'Booking': { category: '旅遊外遊', icon: '🏨', keywords: ['booking', 'Booking', 'Booking.com'] },
  'Trip.com': { category: '旅遊外遊', icon: '✈️', keywords: ['trip.com', 'Trip.com', '攜程'] },
  'Airbnb': { category: '旅遊外遊', icon: '🏠', keywords: ['airbnb', 'Airbnb'] },
  
  // 👗 服飾美容
  'Uniqlo': { category: '服飾美容', icon: '👕', keywords: ['uniqlo', 'Uniqlo', '優衣庫'] },
  'Zara': { category: '服飾美容', icon: '👗', keywords: ['zara', 'Zara'] },
  'H&M': { category: '服飾美容', icon: '👕', keywords: ['hm', 'H&M', 'H and M'] },
  'GU': { category: '服飾美容', icon: '👕', keywords: ['gu', 'GU', '極優'] },
  'UNY': { category: '服飾美容', icon: '👗', keywords: ['uny', 'UNY', '優衣庫'] },
  'IKEA': { category: '服飾美容', icon: '🛋️', keywords: ['ikea', 'IKEA'] },
  
  // 💡 公用事業
  '水費': { category: '公用事業', icon: '💧', keywords: ['水費', '水務署'] },
  '電費': { category: '公用事業', icon: '⚡', keywords: ['電費', '中電', '港燈', '電費單'] },
  '煤氣': { category: '公用事業', icon: '🔥', keywords: ['煤氣', '煤氣費', '香港中華煤氣'] },
  '煤氣費': { category: '公用事業', icon: '🔥', keywords: ['煤氣', '煤氣費'] },
  '寬頻': { category: '公用事業', icon: '🌐', keywords: ['寬頻', '寬頻費', '網費'] },
  '電話費': { category: '公用事業', icon: '📱', keywords: ['電話費', '手機費', '電訊費'] },
  '電訊盈科': { category: '公用事業', icon: '📱', keywords: ['電訊盈科', 'PCCW'] },
  'CSL': { category: '公用事業', icon: '📱', keywords: ['csl', 'CSL', '1010'] },
  '1010': { category: '公用事業', icon: '📱', keywords: ['1010', 'SmarTone'] },
  'SmarTone': { category: '公用事業', icon: '📱', keywords: ['smartone', 'SmarTone'] },
};

// 搜尋商戶
export function searchMerchant(query) {
  if (!query || query.length < 1) return [];
  
  const queryLower = query.toLowerCase();
  const results = [];
  
  // 遍歷所有商戶映射
  for (const [merchantName, data] of Object.entries(merchantMappings)) {
    // 檢查商戶名稱是否包含查詢關鍵字
    if (merchantName.toLowerCase().includes(queryLower) ||
        data.keywords.some(keyword => keyword.toLowerCase().includes(queryLower))) {
      results.push({
        name: merchantName,
        ...data
      });
    }
  }
  
  // 按相關性排序（名稱完全匹配的排前面）
  results.sort((a, b) => {
    const aExact = a.name.toLowerCase() === queryLower;
    const bExact = b.name.toLowerCase() === queryLower;
    
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    
    return a.name.localeCompare(b.name);
  });
  
  return results.slice(0, 5); // 最多返回5個結果
}

// 獲取商戶類別
export function getMerchantCategory(merchantName) {
  const result = merchantMappings[merchantName];
  return result ? { category: result.category, icon: result.icon } : null;
}

// 獲取所有商戶名稱（用於下拉選單）
export function getAllMerchants() {
  return Object.keys(merchantMappings).sort();
}
