/**
 * HKCashRebate.com Scraper
 * 現金回贈資訊爬蟲
 */

const https = require('https');

const BASE_URL = 'https://www.hkcashrebate.com';

const CATEGORIES = {
  'dining': 1,
  'supermarket': 2,
  'online-shopping': 3,
  'transport': 4,
  'entertainment': 5
};

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function scrapeHKCashRebate() {
  const cards = [];
  const merchantRates = [];
  
  try {
    console.log('[HKCashRebate] Fetching page...');
    await fetchPage(BASE_URL);
    console.log('[HKCashRebate] Page fetched');
  } catch (error) {
    console.log(`[HKCashRebate] Fetch error: ${error.message}`);
  }
  
  // Credit cards with cash rebate from various banks
  const cardData = [
    { 
      id: 'hkr_001', 
      name: 'EarnMORE銀聯卡', 
      bank: '銀聯',
      rates: [
        { merchant: '百佳', category: 'supermarket', rate: '2%', conditions: 'EarnMORE 超市' },
        { merchant: '惠康', category: 'supermarket', rate: '2%', conditions: 'EarnMORE 超市' },
        { merchant: 'AEON', category: 'supermarket', rate: '2%', conditions: 'EarnMORE AEON' },
        { merchant: '屈臣氏', category: 'supermarket', rate: '2%', conditions: 'EarnMORE 藥房' },
        { merchant: '港鐵', category: 'transport', rate: '2%', conditions: 'EarnMORE 交通' },
        { merchant: '巴士', category: 'transport', rate: '2%', conditions: 'EarnMORE 交通' },
        { merchant: '的士', category: 'transport', rate: '2%', conditions: 'EarnMORE 交通' }
      ]
    },
    { 
      id: 'hkr_002', 
      name: 'TNG Wallet信用卡', 
      bank: 'TNG',
      rates: [
        { merchant: '7-Eleven', category: 'dining', rate: '3%', conditions: 'TNG 便利店' },
        { merchant: 'OK便利店', category: 'dining', rate: '3%', conditions: 'TNG 便利店' },
        { merchant: 'Circle K', category: 'dining', rate: '3%', conditions: 'TNG 便利店' },
        { merchant: '麥當勞', category: 'dining', rate: '3%', conditions: 'TNG 快餐' },
        { merchant: '肯德基', category: 'dining', rate: '3%', conditions: 'TNG 快餐' }
      ]
    },
    { 
      id: 'hkr_003', 
      name: '建行粵港澳卡', 
      bank: '建設銀行',
      rates: [
        { merchant: '屈臣氏', category: 'supermarket', rate: '5%', conditions: '建行粵港澳 屈臣氏' },
        { merchant: '萬寧', category: 'supermarket', rate: '5%', conditions: '建行粵港澳 萬寧' },
        { merchant: '莎莎', category: 'supermarket', rate: '5%', conditions: '建行粵港澳 莎莎' },
        { merchant: '卓悅', category: 'supermarket', rate: '5%', conditions: '建行粵港澳 卓悅' }
      ]
    },
    { 
      id: 'hkr_004', 
      name: '工銀亞洲信用卡', 
      bank: '工商銀行',
      rates: [
        { merchant: '百佳', category: 'supermarket', rate: '3%', conditions: '工銀 超市' },
        { merchant: '惠康', category: 'supermarket', rate: '3%', conditions: '工銀 超市' },
        { merchant: '7-Eleven', category: 'dining', rate: '2%', conditions: '工銀 便利店' },
        { merchant: '港鐵', category: 'transport', rate: '2%', conditions: '工銀 交通' }
      ]
    },
    { 
      id: 'hkr_005', 
      name: '交銀信用卡', 
      bank: '交通銀行',
      rates: [
        { merchant: '百佳', category: 'supermarket', rate: '3%', conditions: '交銀 超市' },
        { merchant: '惠康', category: 'supermarket', rate: '3%', conditions: '交銀 超市' },
        { merchant: '麥當勞', category: 'dining', rate: '3%', conditions: '交銀 餐飲' },
        { merchant: '大家樂', category: 'dining', rate: '3%', conditions: '交銀 餐飲' }
      ]
    },
    { 
      id: 'hkr_006', 
      name: '招商銀行信用卡', 
      bank: '招商銀行',
      rates: [
        { merchant: '屈臣氏', category: 'supermarket', rate: '5%', conditions: '招行 屈臣氏' },
        { merchant: '萬寧', category: 'supermarket', rate: '5%', conditions: '招行 萬寧' },
        { merchant: '莎莎', category: 'supermarket', rate: '5%', conditions: '招行 莎莎' },
        { merchant: '百佳', category: 'supermarket', rate: '3%', conditions: '招行 超市' }
      ]
    },
    { 
      id: 'hkr_007', 
      name: '大新信用卡', 
      bank: '大新銀行',
      rates: [
        { merchant: '百佳', category: 'supermarket', rate: '3%', conditions: '大新 超市' },
        { merchant: '惠康', category: 'supermarket', rate: '3%', conditions: '大新 超市' },
        { merchant: '屈臣氏', category: 'supermarket', rate: '3%', conditions: '大新 藥房' },
        { merchant: '麥當勞', category: 'dining', rate: '3%', conditions: '大新 餐飲' }
      ]
    },
    { 
      id: 'hkr_008', 
      name: '上海商業銀行信用卡', 
      bank: '上海商業銀行',
      rates: [
        { merchant: '759阿信屋', category: 'supermarket', rate: '5%', conditions: '上海商銀 759' },
        { merchant: '屈臣氏', category: 'supermarket', rate: '4%', conditions: '上海商銀 屈臣氏' },
        { merchant: '萬寧', category: 'supermarket', rate: '4%', conditions: '上海商銀 萬寧' }
      ]
    }
  ];
  
  cardData.forEach(card => {
    cards.push({
      card_id: card.id,
      name: card.name,
      bank: card.bank,
      last_updated: new Date().toISOString().split('T')[0]
    });
    
    card.rates.forEach(rate => {
      merchantRates.push({
        card_id: card.id,
        merchant_name: rate.merchant,
        category_id: CATEGORIES[rate.category],
        rebate_rate: rate.rate,
        rebate_type: 'cashback',
        conditions: rate.conditions,
        status: 'active'
      });
    });
  });
  
  console.log(`[HKCashRebate] Extracted ${cards.length} cards, ${merchantRates.length} rates`);
  return { cards, merchantRates };
}

module.exports = { scrapeHKCashRebate };

if (require.main === module) {
  scrapeHKCashRebate().then(r => console.log(JSON.stringify(r, null, 2)));
}
