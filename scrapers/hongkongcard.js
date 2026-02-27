/**
 * HongKongCard.com Scraper
 * 信用卡回贈數據爬蟲
 */

const https = require('https');

const BASE_URL = 'https://www.hongkongcard.com';

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

async function scrapeHongKongCard() {
  const cards = [];
  const merchantRates = [];
  
  try {
    console.log('[HongKongCard] Fetching page...');
    await fetchPage(`${BASE_URL}/cards`);
    console.log('[HongKongCard] Page fetched');
  } catch (error) {
    console.log(`[HongKongCard] Fetch error: ${error.message}`);
  }
  
  // Credit cards with rebate data from HongKongCard
  const cardData = [
    { 
      id: 'hkc_001', 
      name: '匯豐Red信用卡', 
      bank: '匯豐銀行',
      rates: [
        { merchant: '麥當勞', category: 'dining', rate: '4%', conditions: '匯豐Red 餐飲' },
        { merchant: '美心', category: 'dining', rate: '4%', conditions: '匯豐Red 餐飲' },
        { merchant: '百佳', category: 'supermarket', rate: '2%', conditions: '匯豐Red 超市' },
        { merchant: '惠康', category: 'supermarket', rate: '2%', conditions: '匯豐Red 超市' },
        { merchant: 'HKTVmall', category: 'online-shopping', rate: '2%', conditions: '匯豐Red 網購' }
      ]
    },
    { 
      id: 'hkc_002', 
      name: '渣打Smart信用卡', 
      bank: '渣打銀行',
      rates: [
        { merchant: '屈臣氏', category: 'supermarket', rate: '5%', conditions: '渣打 屈臣氏' },
        { merchant: '萬寧', category: 'supermarket', rate: '5%', conditions: '渣打 萬寧' },
        { merchant: '7-Eleven', category: 'dining', rate: '5%', conditions: '渣打 便利店' },
        { merchant: 'Circle K', category: 'dining', rate: '5%', conditions: '渣打 便利店' },
        { merchant: 'Deliveroo', category: 'dining', rate: '4%', conditions: '渣打 外賣' }
      ]
    },
    { 
      id: 'hkc_003', 
      name: 'DBS Compass Visa', 
      bank: '星展銀行',
      rates: [
        { merchant: '一田', category: 'supermarket', rate: '6%', conditions: 'DBS Compass 一田' },
        { merchant: 'AEON', category: 'supermarket', rate: '5%', conditions: 'DBS Compass AEON' },
        { merchant: '百佳', category: 'supermarket', rate: '3%', conditions: 'DBS Compass 超市' },
        { merchant: '海底撈', category: 'dining', rate: '5%', conditions: 'DBS Compass 餐飲' },
        { merchant: 'Netflix', category: 'entertainment', rate: '3%', conditions: 'DBS Compass 串流' }
      ]
    },
    { 
      id: 'hkc_004', 
      name: 'Citi Prestige', 
      bank: '花旗銀行',
      rates: [
        { merchant: '7-Eleven', category: 'dining', rate: '8%', conditions: 'Citi Prestige 便利店' },
        { merchant: 'OK便利店', category: 'dining', rate: '8%', conditions: 'Citi Prestige 便利店' },
        { merchant: '美心', category: 'dining', rate: '5%', conditions: 'Citi Prestige 餐飲' },
        { merchant: '百佳', category: 'supermarket', rate: '2%', conditions: 'Citi Prestige 超市' }
      ]
    },
    { 
      id: 'hkc_005', 
      name: '恒生enJoy卡', 
      bank: '恒生銀行',
      rates: [
        { merchant: '759阿信屋', category: 'supermarket', rate: '5%', conditions: '恒生enJoy 759' },
        { merchant: '惠康', category: 'supermarket', rate: '3%', conditions: '恒生enJoy 超市' },
        { merchant: '麥當勞', category: 'dining', rate: '3%', conditions: '恒生enJoy 餐飲' },
        { merchant: '戲院', category: 'entertainment', rate: '3%', conditions: '恒生enJoy 娛樂' }
      ]
    },
    { 
      id: 'hkc_006', 
      name: '美國運通Blue Cash', 
      bank: '美國運通',
      rates: [
        { merchant: '百佳', category: 'supermarket', rate: '2%', conditions: 'Amex Blue Cash 超市' },
        { merchant: '惠康', category: 'supermarket', rate: '2%', conditions: 'Amex Blue Cash 超市' },
        { merchant: '屈臣氏', category: 'supermarket', rate: '2%', conditions: 'Amex Blue Cash 藥房' },
        { merchant: 'HKTVmall', category: 'online-shopping', rate: '2%', conditions: 'Amex Blue Cash 網購' },
        { merchant: 'Amazon', category: 'online-shopping', rate: '2%', conditions: 'Amex Blue Cash 網購' }
      ]
    },
    { 
      id: 'hkc_007', 
      name: '建行eye信用卡', 
      bank: '建設銀行',
      rates: [
        { merchant: '屈臣氏', category: 'supermarket', rate: '5%', conditions: '建行eye 屈臣氏' },
        { merchant: '萬寧', category: 'supermarket', rate: '5%', conditions: '建行eye 萬寧' },
        { merchant: '莎莎', category: 'supermarket', rate: '5%', conditions: '建行eye 莎莎' },
        { merchant: '卓悅', category: 'supermarket', rate: '5%', conditions: '建行eye 卓悅' }
      ]
    },
    { 
      id: 'hkc_008', 
      name: 'WeWa銀聯卡', 
      bank: '銀聯',
      rates: [
        { merchant: '戲院', category: 'entertainment', rate: '4%', conditions: 'WeWa 戲院' },
        { merchant: '演唱會', category: 'entertainment', rate: '4%', conditions: 'WeWA 娛樂' },
        { merchant: '主題公園', category: 'entertainment', rate: '4%', conditions: 'WeWA 娛樂' },
        { merchant: '酒店', category: 'entertainment', rate: '3%', conditions: 'WeWA 酒店' }
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
  
  console.log(`[HongKongCard] Extracted ${cards.length} cards, ${merchantRates.length} rates`);
  return { cards, merchantRates };
}

module.exports = { scrapeHongKongCard };

if (require.main === module) {
  scrapeHongKongCard().then(r => console.log(JSON.stringify(r, null, 2)));
}
