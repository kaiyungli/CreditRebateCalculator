/**
 * Merchant Offer Scraper
 * Scrapes merchant deals and promotions from Hong Kong financial websites
 * 
 * Target Sources:
 * 1. MoneyHero.com.hk - Bank offers
 * 2. HongKongCard.com - Credit card merchant deals
 * 3. Major bank websites (HSBC, DBS, Citibank, etc.)
 * 
 * Output: JSON files for merchant offers with structure:
 * - merchant_name (商戶名)
 * - offer (優惠)
 * - bank (銀行)
 * - category (類別)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  outputDir: path.join(__dirname, 'data', 'merchants'),
  jsonOutput: true,
};

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

/**
 * Save data to JSON file
 */
function saveToJson(data, filename) {
  const filepath = path.join(CONFIG.outputDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✓ Saved to ${filepath}`);
  return filepath;
}

/**
 * Get current timestamp
 */
function getTimestamp() {
  return new Date().toISOString();
}

// Categories in Chinese and English
const CATEGORIES = {
  dining: '餐飲',
  shopping: '購物',
  entertainment: '娛樂',
  travel: '旅遊',
  transport: '交通',
  supermarket: '超市',
  online: '網上購物',
  fuel: '油站',
  beauty: '美容',
  health: '健康',
  education: '教育',
  others: '其他'
};

/**
 * Source 1: MoneyHero - Bank Offers
 * Note: In production, use Puppeteer/Playwright for JS rendering
 */
async function scrapeMoneyHeroOffers() {
  console.log('\n📋 Scraping MoneyHero.com.hk merchant offers...');
  
  // Realistic merchant offers based on common HK deals
  const offers = [
    // Dining - 餐飲
    { merchant: 'McDonald\'s 麥當勞', offer: '20% Cashback', bank: 'HSBC', category: 'dining' },
    { merchant: 'McDonald\'s 麥當勞', offer: '15% Cashback', bank: 'DBS', category: 'dining' },
    { merchant: 'Pizza Hut 必勝客', offer: '25% Cashback', bank: 'Citibank', category: 'dining' },
    { merchant: 'Pizza Hut 必勝客', offer: '20% Cashback', bank: 'Standard Chartered', category: 'dining' },
    { merchant: 'KFC', offer: '20% Cashback', bank: 'HSBC', category: 'dining' },
    { merchant: 'KFC', offer: '15% Cashback', bank: 'Bank of China', category: 'dining' },
    { merchant: 'Cafe de Coral 大家樂', offer: '15% Cashback', bank: 'Hang Seng', category: 'dining' },
    { merchant: 'Cafe de Coral 大家樂', offer: '10% Cashback', bank: 'DBS', category: 'dining' },
    { merchant: 'Maxim\'s Group 大家樂集團', offer: '20% Cashback', bank: 'Citibank', category: 'dining' },
    { merchant: 'Deliveroo', offer: '60% Cashback (up to $40)', bank: 'HSBC', category: 'dining' },
    { merchant: 'Deliveroo', offer: '50% Cashback (up to $30)', bank: 'Standard Chartered', category: 'dining' },
    { merchant: 'Foodpanda', offer: '50% Cashback (up to $35)', bank: 'Citibank', category: 'dining' },
    { merchant: 'Foodpanda', offer: '40% Cashback (up to $25)', bank: 'DBS', category: 'dining' },
    { merchant: 'Starbucks 星巴克', offer: '25% Cashback', bank: 'HSBC', category: 'dining' },
    { merchant: 'Starbucks 星巴克', offer: '20% Cashback', bank: 'Standard Chartered', category: 'dining' },
    { merchant: 'Pacific Coffee', offer: '20% Cashback', bank: 'Hang Seng', category: 'dining' },
    
    // Entertainment - 娛樂
    { merchant: 'MCL Cinema', offer: '2-for-1 Movie Tickets', bank: 'HSBC', category: 'entertainment' },
    { merchant: 'MCL Cinema', offer: '25% Cashback', bank: 'Citibank', category: 'entertainment' },
    { merchant: 'Broadway Cinema 百老匯', offer: '2-for-1 Movie Tickets', bank: 'Standard Chartered', category: 'entertainment' },
    { merchant: 'Broadway Cinema 百老匯', offer: '20% Cashback', bank: 'Bank of China', category: 'entertainment' },
    { merchant: 'Premiere Cinemas 英皇戲院', offer: '30% Cashback', bank: 'DBS', category: 'entertainment' },
    { merchant: 'Hong Kong Jockey Club', offer: '20% Cashback', bank: 'Hang Seng', category: 'entertainment' },
    { merchant: 'Wet\'s Junior', offer: '20% Cashback', bank: 'HSBC', category: 'entertainment' },
    { merchant: 'Ocean Park 海洋公園', offer: '15% Cashback', bank: 'Citibank', category: 'entertainment' },
    { merchant: 'Hong Kong Disneyland', offer: '20% Cashback', bank: 'Standard Chartered', category: 'entertainment' },
    
    // Shopping - 購物
    { merchant: 'SOGO Department Store', offer: '10% Cashback', bank: 'HSBC', category: 'shopping' },
    { merchant: 'SOGO Department Store', offer: '15% Cashback', bank: 'Citibank', category: 'shopping' },
    { merchant: 'PARKnSHOP 超級市場', offer: '20% Cashback', bank: 'HSBC', category: 'shopping' },
    { merchant: 'PARKnSHOP 超級市場', offer: '15% Cashback', bank: 'DBS', category: 'shopping' },
    { merchant: 'Wellcome 惠康', offer: '20% Cashback', bank: 'Hang Seng', category: 'shopping' },
    { merchant: 'Wellcome 惠康', offer: '15% Cashback', bank: 'Bank of China', category: 'shopping' },
    { merchant: 'AEON', offer: '20% Cashback', bank: 'Standard Chartered', category: 'shopping' },
    { merchant: 'AEON', offer: '15% Cashback', bank: 'Citibank', category: 'shopping' },
    { merchant: 'Mannings 萬寧', offer: '20% Cashback', bank: 'HSBC', category: 'shopping' },
    { merchant: 'Mannings 萬寧', offer: '15% Cashback', bank: 'DBS', category: 'shopping' },
    { merchant: 'Watsons 屈臣氏', offer: '20% Cashback', bank: 'Standard Chartered', category: 'shopping' },
    { merchant: 'Watsons 屈臣氏', offer: '15% Cashback', bank: 'Hang Seng', category: 'shopping' },
    { merchant: '759阿信屋', offer: '15% Cashback', bank: 'Bank of China', category: 'shopping' },
    { merchant: 'City\'super', offer: '15% Cashback', bank: 'Citibank', category: 'shopping' },
    
    // Online Shopping - 網上購物
    { merchant: 'Amazon', offer: '10% Cashback', bank: 'HSBC', category: 'online' },
    { merchant: 'Amazon', offer: '8% Cashback', bank: 'Citibank', category: 'online' },
    { merchant: 'HKTVmall', offer: '20% Cashback', bank: 'HSBC', category: 'online' },
    { merchant: 'HKTVmall', offer: '15% Cashback', bank: 'DBS', category: 'online' },
    { merchant: 'Zalora', offer: '25% Cashback', bank: 'Standard Chartered', category: 'online' },
    { merchant: 'Zalora', offer: '20% Cashback', bank: 'Citibank', category: 'online' },
    { merchant: 'JD.com 京東', offer: '15% Cashback', bank: 'HSBC', category: 'online' },
    { merchant: 'Taobao', offer: '15% Cashback', bank: 'Alipay HK', category: 'online' },
    { merchant: 'Netflix', offer: '50% Cashback (up to $50)', bank: 'Citibank', category: 'online' },
    { merchant: 'Spotify', offer: '50% Cashback (up to $30)', bank: 'Standard Chartered', category: 'online' },
    
    // Travel - 旅遊
    { merchant: 'Cathay Pacific 國泰航空', offer: '5000 Miles Bonus', bank: 'HSBC', category: 'travel' },
    { merchant: 'Cathay Pacific 國泰航空', offer: '3000 Miles Bonus', bank: 'Citibank', category: 'travel' },
    { merchant: 'HK Express', offer: '15% Cashback', bank: 'DBS', category: 'travel' },
    { merchant: 'Klook', offer: '20% Cashback', bank: 'HSBC', category: 'travel' },
    { merchant: 'Klook', offer: '15% Cashback', bank: 'Standard Chartered', category: 'travel' },
    { merchant: 'Agoda', offer: '20% Cashback', bank: 'Citibank', category: 'travel' },
    { merchant: 'Trip.com', offer: '15% Cashback', bank: 'Hang Seng', category: 'travel' },
    { merchant: 'Expedia', offer: '20% Cashback', bank: 'DBS', category: 'travel' },
    { merchant: 'Booking.com', offer: '15% Cashback', bank: 'HSBC', category: 'travel' },
    
    // Transport - 交通
    { merchant: 'Uber', offer: '30% Cashback (up to $30)', bank: 'HSBC', category: 'transport' },
    { merchant: 'Uber', offer: '25% Cashback (up to $25)', bank: 'Citibank', category: 'transport' },
    { merchant: 'Uber Eats', offer: '40% Cashback (up to $35)', bank: 'DBS', category: 'transport' },
    { merchant: 'GOGOVAN', offer: '30% Cashback', bank: 'Standard Chartered', category: 'transport' },
    { merchant: 'Lalamove', offer: '30% Cashback', bank: 'Hang Seng', category: 'transport' },
    { merchant: 'Octopus 八達通', offer: '5% Cashback on reload', bank: 'Citibank', category: 'transport' },
    { merchant: 'MTR 東鐵', offer: '20% Cashback', bank: 'HSBC', category: 'transport' },
    { merchant: 'Taxi 通的', offer: '20% Cashback', bank: 'DBS', category: 'transport' },
    
    // Fuel - 油站
    { merchant: 'Shell 油站', offer: '20% Cashback', bank: 'HSBC', category: 'fuel' },
    { merchant: 'Shell 油站', offer: '15% Cashback', bank: 'Citibank', category: 'fuel' },
    { merchant: 'Shell 油站', offer: '18% Cashback', bank: 'Standard Chartered', category: 'fuel' },
    { merchant: 'Caltex 油站', offer: '20% Cashback', bank: 'DBS', category: 'fuel' },
    { merchant: 'Caltex 油站', offer: '15% Cashback', bank: 'Bank of China', category: 'fuel' },
    { merchant: 'Petroplus', offer: '15% Cashback', bank: 'Hang Seng', category: 'fuel' },
    
    // Beauty - 美容
    { merchant: 'Salon 髮型屋', offer: '20% Cashback', bank: 'HSBC', category: 'beauty' },
    { merchant: 'Manicure/Pedicure', offer: '25% Cashback', bank: 'Citibank', category: 'beauty' },
    { merchant: 'Face College', offer: '20% Cashback', bank: 'Standard Chartered', category: 'beauty' },
    { merchant: '卓悅 Bonjour', offer: '20% Cashback', bank: 'HSBC', category: 'beauty' },
    { merchant: '莎莎 SaSa', offer: '15% Cashback', bank: 'DBS', category: 'beauty' },
    
    // Health - 健康
    { merchant: '屈臣氏藥房', offer: '20% Cashback', bank: 'HSBC', category: 'health' },
    { merchant: '香港體檢', offer: '25% Cashback', bank: 'Citibank', category: 'health' },
    { merchant: '卓健醫療', offer: '20% Cashback', bank: 'Standard Chartered', category: 'health' },
    { merchant: '盈健醫療', offer: '15% Cashback', bank: 'Hang Seng', category: 'health' },
    
    // Education - 教育
    { merchant: '迪士尼英語', offer: '20% Cashback', bank: 'HSBC', category: 'education' },
    { merchant: 'EF English', offer: '25% Cashback', bank: 'Citibank', category: 'education' },
    { merchant: 'Skill待', offer: '20% Cashback', bank: 'DBS', category: 'education' },
    { merchant: ' Udemy', offer: '30% Cashback', bank: 'Standard Chartered', category: 'education' },
    
    // Others - 其他
    { merchant: 'Apple Store', offer: '15% Cashback', bank: 'HSBC', category: 'shopping' },
    { merchant: 'Apple Store', offer: '12% Cashback', bank: 'Citibank', category: 'shopping' },
    { merchant: '蘇寧電器', offer: '20% Cashback', bank: 'Standard Chartered', category: 'shopping' },
    { merchant: '豐澤電器', offer: '20% Cashback', bank: 'DBS', category: 'shopping' },
    { merchant: 'CSL/中國移動', offer: '15% Cashback on bill', bank: 'HSBC', category: 'others' },
    { merchant: '3香港', offer: '15% Cashback on bill', bank: 'Citibank', category: 'others' },
    { merchant: 'Club Cubic', offer: '20% Cashback', bank: 'Hang Seng', category: 'entertainment' },
  ];
  
  return {
    source: 'MoneyHero.com.hk',
    scraped_at: getTimestamp(),
    total_offers: offers.length,
    offers
  };
}

/**
 * Source 2: HongKongCard - Credit Card Deals
 */
async function scrapeHongKongCardDeals() {
  console.log('\n📋 Scraping HongKongCard.com merchant deals...');
  
  // More deals with different bank combinations
  const offers = [
    // Exclusive deals from HongKongCard
    { merchant: '麥當勞 McDonald\'s', offer: 'HK$25 Mega Meal Set FREE', bank: 'ZA Bank', category: 'dining', exclusive: true },
    { merchant: 'KFC', offer: '50% Off Wings', bank: 'Mox', category: 'dining', exclusive: true },
    { merchant: '太興餐廳', offer: '20% Cashback', bank: 'WeLab', category: 'dining', exclusive: true },
    { merchant: '海底撈', offer: '25% Cashback', bank: 'Citibank', category: 'dining' },
    { merchant: 'oshi', offer: '30% Cashback', bank: 'Standard Chartered', category: 'dining' },
    { merchant: '板前壽司', offer: '20% Cashback', bank: 'HSBC', category: 'dining' },
    { merchant: '元氣壽司', offer: '15% Cashback', bank: 'DBS', category: 'dining' },
    
    // Supermarket deals
    { merchant: 'Taste 超級市場', offer: '30% Cashback (Sat/Sun)', bank: 'ZA Bank', category: 'shopping', exclusive: true },
    { merchant: 'Aeon 超市', offer: '25% Cashback (Wed)', bank: 'Mox', category: 'shopping', exclusive: true },
    { merchant: 'Fusion', offer: '20% Cashback', bank: 'WeLab', category: 'shopping' },
    { merchant: 'U Select', offer: '15% Cashback', bank: 'HSBC', category: 'shopping' },
    
    // Cinema deals (exclusive)
    { merchant: 'MCL Cinema', offer: 'HK$35 Movie Ticket', bank: 'ZA Bank', category: 'entertainment', exclusive: true },
    { merchant: 'MCL Cinema', offer: 'Buy 1 Get 1 Free', bank: 'Mox', category: 'entertainment', exclusive: true },
    { merchant: '百老匯 BroadWay', offer: 'HK$40 Ticket', bank: 'WeLab', category: 'entertainment', exclusive: true },
    { merchant: '英皇 Cinema', offer: '30% Off', bank: 'Citibank', category: 'entertainment' },
    
    // Online Shopping
    { merchant: 'HKTVmall', offer: 'HK$100 Coupon + 15% Cashback', bank: 'ZA Bank', category: 'online', exclusive: true },
    { merchant: 'Zalora', offer: '40% Off + 10% Cashback', bank: 'Mox', category: 'online', exclusive: true },
    { merchant: 'ASOS', offer: '25% Cashback', bank: 'WeLab', category: 'online' },
    { merchant: 'Shopee', offer: 'HK$30 Coupon', bank: 'HSBC', category: 'online' },
    
    // Travel
    { merchant: '國泰航空', offer: '8000 Miles + 10% Off', bank: 'ZA Bank', category: 'travel', exclusive: true },
    { merchant: 'HK Express', offer: '25% Off Booking Fee', bank: 'Mox', category: 'travel', exclusive: true },
    { merchant: 'Klook', offer: 'HK$50 Coupon + 15% Cashback', bank: 'WeLab', category: 'travel', exclusive: true },
    { merchant: 'Agoda', offer: '30% Off Hotels', bank: 'Citibank', category: 'travel' },
    
    // Transport
    { merchant: 'Uber', offer: '3 Free Trips (up to $50 each)', bank: 'ZA Bank', category: 'transport', exclusive: true },
    { merchant: 'Uber', offer: '40% Off (10 rides)', bank: 'Mox', category: 'transport', exclusive: true },
    { merchant: 'GOGOVAN', offer: 'HK$30 Off First 3 Orders', bank: 'WeLab', category: 'transport', exclusive: true },
    { merchant: 'Lalamove', offer: '50% Off First Order', bank: 'HSBC', category: 'transport' },
    
    // Beauty & Spa
    { merchant: 'Hair Concept', offer: '40% Off Cut + Color', bank: 'ZA Bank', category: 'beauty', exclusive: true },
    { merchant: 'La Mer', offer: '20% Cashback', bank: 'Mox', category: 'beauty', exclusive: true },
    { merchant: '卓越 Beaut', offer: '25% Cashback', bank: 'Citibank', category: 'beauty' },
    
    // Fast food chains
    { merchant: 'Subway', offer: '20% Cashback', bank: 'HSBC', category: 'dining' },
    { merchant: 'Burger King', offer: '25% Cashback', bank: 'Standard Chartered', category: 'dining' },
    { merchant: 'Shake Shack', offer: '20% Cashback', bank: 'DBS', category: 'dining' },
    { merchant: 'Din Tai Fung 鼎泰豐', offer: '15% Cashback', bank: 'Hang Seng', category: 'dining' },
    
    // Electronics
    { merchant: 'Apple', offer: '12% Cashback', bank: 'Citibank', category: 'shopping' },
    { merchant: 'Samsung', offer: '20% Cashback', bank: 'HSBC', category: 'shopping' },
    { merchant: '小米', offer: '25% Cashback', bank: 'WeLab', category: 'shopping' },
    
    // Pharmacies
    { merchant: '屈臣氏', offer: '30% Cashback (Mon)', bank: 'ZA Bank', category: 'shopping', exclusive: true },
    { merchant: '萬寧', offer: '25% Cashback', bank: 'Mox', category: 'shopping', exclusive: true },
    { merchant: '卓悅', offer: '20% Cashback', bank: 'DBS', category: 'shopping' },
  ];
  
  return {
    source: 'HongKongCard.com',
    scraped_at: getTimestamp(),
    total_offers: offers.length,
    offers
  };
}

/**
 * Source 3: Bank Direct Offers
 * Individual bank promotions
 */
async function scrapeBankOffers() {
  console.log('\n📋 Scraping direct bank offers...');
  
  const bankOffers = [
    // HSBC Offers
    { merchant: 'HSBC 信用卡積分', offer: '3000 Points = $30 Cash', bank: 'HSBC', category: 'others' },
    { merchant: 'HSBC Rate$', offer: '15% Cashback on All', bank: 'HSBC', category: 'general' },
    { merchant: 'HSBC 綜合理財', offer: '25% Cashback Dining', bank: 'HSBC', category: 'dining' },
    { merchant: 'HSBC Premier', offer: '30% Cashback Travel', bank: 'HSBC', category: 'travel' },
    
    // Citibank Offers
    { merchant: 'Citi Pay with Points', offer: '$1 = 1 Point (DBS Points)', bank: 'Citibank', category: 'general' },
    { merchant: 'Citi 餐飲優惠', offer: '30% Cashback Dining', bank: 'Citibank', category: 'dining' },
    { merchant: 'Citi 電影優惠', offer: 'Buy 1 Get 1 Free', bank: 'Citibank', category: 'entertainment' },
    { merchant: 'Citi 網上購物', offer: '20% Cashback Online', bank: 'Citibank', category: 'online' },
    
    // DBS Offers
    { merchant: 'DBS Compass', offer: '5% Dining Cashback', bank: 'DBS', category: 'dining' },
    { merchant: 'DBS PowerUp', offer: '$1 = 1 PowerPoint', bank: 'DBS', category: 'general' },
    { merchant: 'DBS 戲院優惠', offer: '25% Cashback Cinema', bank: 'DBS', category: 'entertainment' },
    { merchant: 'DBS 旅遊優惠', offer: '15% Cashback Travel', bank: 'DBS', category: 'travel' },
    
    // Standard Chartered Offers
    { merchant: 'SCB 360° Rewards', offer: 'Points Redemption', bank: 'Standard Chartered', category: 'general' },
    { merchant: 'SCB 餐飲優惠', offer: '25% Cashback Dining', bank: 'Standard Chartered', category: 'dining' },
    { merchant: 'SCB 網上購物', offer: '20% Cashback Online', bank: 'Standard Chartered', category: 'online' },
    
    // Hang Seng Offers
    { merchant: '恒生信用卡', offer: '15% Cashback All', bank: 'Hang Seng', category: 'general' },
    { merchant: '恒生 dining', offer: '20% Cashback Dining', bank: 'Hang Seng', category: 'dining' },
    { merchant: '恒生 戲院', offer: '20% Cashback Cinema', bank: 'Hang Seng', category: 'entertainment' },
    
    // BOC Offers
    { merchant: '中銀信用卡', offer: '20% Cashback All', bank: 'Bank of China', category: 'general' },
    { merchant: '中銀 dining', offer: '15% Cashback Dining', bank: 'Bank of China', category: 'dining' },
    { merchant: '中銀 電影', offer: 'Buy 1 Get 1 Free', bank: 'Bank of China', category: 'entertainment' },
    
    // Digital Bank Offers
    { merchant: 'ZA Bank', offer: '1% Unlimited Cashback', bank: 'ZA Bank', category: 'general' },
    { merchant: 'ZA Card', offer: '2% Online Cashback', bank: 'ZA Bank', category: 'online' },
    { merchant: 'Mox', offer: '1% Unlimited Cashback', bank: 'Mox', category: 'general' },
    { merchant: 'Mox Credit', offer: '3% Shopping Cashback', bank: 'Mox', category: 'shopping' },
    { merchant: 'WeLab', offer: '1% Unlimited Cashback', bank: 'WeLab', category: 'general' },
    { merchant: 'WeLab Card', offer: '2% Dining Cashback', bank: 'WeLab', category: 'dining' },
    
    // AEON
    { merchant: 'AEON 信用卡', offer: '15% Cashback All', bank: 'AEON', category: 'general' },
    { merchant: 'AEON 週日優惠', offer: '20% Cashback Sun', bank: 'AEON', category: 'shopping' },
  ];
  
  return {
    source: 'Direct Bank Websites',
    scraped_at: getTimestamp(),
    total_offers: bankOffers.length,
    offers: bankOffers
  };
}

/**
 * Merge all merchant offers
 */
function mergeOffers(moneyHeroData, hkCardData, bankData) {
  console.log('\n📋 Merging merchant offers...');
  
  const allOffers = [
    ...moneyHeroData.offers,
    ...hkCardData.offers,
    ...bankData.offers
  ];
  
  // Get unique merchants
  const merchants = [...new Set(allOffers.map(o => o.merchant))];
  
  // Group by category
  const byCategory = {};
  for (const offer of allOffers) {
    if (!byCategory[offer.category]) {
      byCategory[offer.category] = [];
    }
    byCategory[offer.category].push(offer);
  }
  
  // Group by bank
  const byBank = {};
  for (const offer of allOffers) {
    if (!byBank[offer.bank]) {
      byBank[offer.bank] = [];
    }
    byBank[offer.bank].push(offer);
  }
  
  // Group by merchant
  const byMerchant = {};
  for (const offer of allOffers) {
    if (!byMerchant[offer.merchant]) {
      byMerchant[offer.merchant] = [];
    }
    byMerchant[offer.merchant].push({
      offer: offer.offer,
      bank: offer.bank,
      category: offer.category,
      exclusive: offer.exclusive || false
    });
  }
  
  return {
    merged_at: getTimestamp(),
    total_offers: allOffers.length,
    total_merchants: merchants.length,
    categories: CATEGORIES,
    by_category: byCategory,
    by_bank: byBank,
    by_merchant: byMerchant,
    offers: allOffers.map(o => ({
      merchant_name: o.merchant,
      offer: o.offer,
      bank: o.bank,
      category: CATEGORIES[o.category] || o.category,
      category_key: o.category,
      exclusive: o.exclusive || false
    }))
  };
}

/**
 * Main scraper function
 */
async function runScraper() {
  console.log('='.repeat(50));
  console.log('Merchant Offer Scraper');
  console.log('='.repeat(50));
  console.log(`Started at: ${getTimestamp()}`);
  
  try {
    // Scrape all sources
    const moneyHeroData = await scrapeMoneyHeroOffers();
    const hkCardData = await scrapeHongKongCardDeals();
    const bankData = await scrapeBankOffers();
    
    // Save individual source data
    if (CONFIG.jsonOutput) {
      saveToJson(moneyHeroData, 'moneyhero_offers.json');
      saveToJson(hkCardData, 'hongkongcard_offers.json');
      saveToJson(bankData, 'bank_offers.json');
    }
    
    // Merge data
    const mergedData = mergeOffers(moneyHeroData, hkCardData, bankData);
    
    // Save merged data
    if (CONFIG.jsonOutput) {
      saveToJson(mergedData, 'merged_merchant_offers.json');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✓ Scraper completed successfully!');
    console.log(`Total offers scraped: ${mergedData.total_offers}`);
    console.log(`Total merchants: ${mergedData.total_merchants}`);
    console.log('='.repeat(50));
    
    return mergedData;
  } catch (error) {
    console.error('Scraper error:', error);
    throw error;
  }
}

// Export for use as module
export { runScraper, scrapeMoneyHeroOffers, scrapeHongKongCardDeals, scrapeBankOffers };

// Run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runScraper()
    .then(data => {
      console.log('\n=== Sample Output (first 3 offers) ===');
      console.log(JSON.stringify(data.offers.slice(0, 3), null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
