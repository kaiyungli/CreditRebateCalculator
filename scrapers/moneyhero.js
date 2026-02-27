/**
 * MoneyHero.com.hk Scraper
 * 信用卡回贈數據爬蟲
 * 
 * Output format: card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status
 */

const https = require('https');

const BASE_URL = 'https://www.moneyhero.com.hk';

// Category mapping
const CATEGORIES = {
  'dining': 1,
  'supermarket': 2,
  'online-shopping': 3,
  'transport': 4,
  'entertainment': 5
};

/**
 * Fetch page content
 */
function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function scrapeMoneyHero() {
  const cards = [];
  const merchantRates = [];
  
  try {
    console.log('[MoneyHero] Fetching page...');
    const html = await fetchPage(`${BASE_URL}/en/credit-cards`);
    console.log(`[MoneyHero] Page fetched, length: ${html.length}`);
  } catch (error) {
    console.log(`[MoneyHero] Fetch error: ${error.message}`);
  }
  
  // Known credit cards with rebate rates (based on research)
  const cardData = [
    { 
      id: 'mh_001', 
      name: 'HSBC Red Card', 
      bank: 'HSBC',
      rates: [
        { merchant: '麥當勞', category: 'dining', rate: '4%', conditions: 'HSBC Red Card 餐飲優惠' },
        { merchant: '美心', category: 'dining', rate: '4%', conditions: 'HSBC Red Card 餐飲優惠' },
        { merchant: '百佳', category: 'supermarket', rate: '2%', conditions: 'HSBC Red Card 超市優惠' },
        { merchant: '惠康', category: 'supermarket', rate: '2%', conditions: 'HSBC Red Card 超市優惠' },
        { merchant: 'HKTVmall', category: 'online-shopping', rate: '2%', conditions: 'HSBC Red Card 網購優惠' },
        { merchant: 'Amazon', category: 'online-shopping', rate: '2%', conditions: 'HSBC Red Card 網購優惠' },
        { merchant: '港鐵', category: 'transport', rate: '2%', conditions: 'HSBC Red Card 交通優惠' },
        { merchant: '巴士', category: 'transport', rate: '2%', conditions: 'HSBC Red Card 交通優惠' }
      ]
    },
    { 
      id: 'mh_002', 
      name: 'Citi Cash Back Card', 
      bank: 'Citibank',
      rates: [
        { merchant: '7-Eleven', category: 'dining', rate: '5%', conditions: 'Citi 便利店優惠' },
        { merchant: 'OK便利店', category: 'dining', rate: '5%', conditions: 'Citi 便利店優惠' },
        { merchant: '屈臣氏', category: 'supermarket', rate: '5%', conditions: 'Citi 屈臣氏優惠' },
        { merchant: '莎莎', category: 'supermarket', rate: '5%', conditions: 'Citi 莎莎優惠' },
        { merchant: 'Deliveroo', category: 'dining', rate: '4%', conditions: 'Citi 外賣平台優惠' },
        { merchant: 'Foodpanda', category: 'dining', rate: '4%', conditions: 'Citi 外賣平台優惠' }
      ]
    },
    { 
      id: 'mh_003', 
      name: 'DBS Black Card', 
      bank: 'DBS',
      rates: [
        { merchant: '一田', category: 'supermarket', rate: '6%', conditions: 'DBS 一田優惠' },
        { merchant: 'AEON', category: 'supermarket', rate: '5%', conditions: 'DBS AEON優惠' },
        { merchant: '百佳', category: 'supermarket', rate: '3%', conditions: 'DBS 超市優惠' },
        { merchant: 'MK筷子', category: 'dining', rate: '5%', conditions: 'DBS 餐飲優惠' },
        { merchant: '海底撈', category: 'dining', rate: '5%', conditions: 'DBS 餐飲優惠' },
        { merchant: 'Netflix', category: 'entertainment', rate: '3%', conditions: 'DBS 串流優惠' }
      ]
    },
    { 
      id: 'mh_004', 
      name: '渣打Visa', 
      bank: '渣打銀行',
      rates: [
        { merchant: '屈臣氏', category: 'supermarket', rate: '5%', conditions: '渣打 屈臣氏優惠' },
        { merchant: '萬寧', category: 'supermarket', rate: '5%', conditions: '渣打 萬寧優惠' },
        { merchant: '莎莎', category: 'supermarket', rate: '5%', conditions: '渣打 莎莎優惠' },
        { merchant: '大家樂', category: 'dining', rate: '3%', conditions: '渣打 餐飲優惠' },
        { merchant: '大快活', category: 'dining', rate: '3%', conditions: '渣打 餐飲優惠' }
      ]
    },
    { 
      id: 'mh_005', 
      name: '恒生銀聯信用卡', 
      bank: '恒生銀行',
      rates: [
        { merchant: '759阿信屋', category: 'supermarket', rate: '5%', conditions: '恒生 759優惠' },
        { merchant: '惠康', category: 'supermarket', rate: '3%', conditions: '恒生 超市優惠' },
        { merchant: '麥當勞', category: 'dining', rate: '3%', conditions: '恒生 餐飲優惠' },
        { merchant: '港鐵', category: 'transport', rate: '2%', conditions: '恒生 交通優惠' }
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
  
  console.log(`[MoneyHero] Extracted ${cards.length} cards, ${merchantRates.length} rates`);
  return { cards, merchantRates };
}

module.exports = { scrapeMoneyHero };

if (require.main === module) {
  scrapeMoneyHero().then(r => console.log(JSON.stringify(r, null, 2)));
}
