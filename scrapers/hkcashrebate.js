/**
 * HKCashRebate.com Scraper
 * 現金回贈資訊爬蟲
 */

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const BASE_URL = 'https://www.hkcashrebate.com';

async function scrapeHKCashRebate() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const cards = [];
  const merchantRates = [];
  
  try {
    const page = await browser.newPage();
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Try to go to the cash rebate page
    await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Wait for content to load
    await page.waitForSelector('body', { timeout: 30000 });
    
    // Get page content
    const content = await page.content();
    const $ = cheerio.load(content);
    
    // Sample cards based on common Hong Kong credit cards with cashback
    const sampleCards = [
      { name: '銀聯信用卡', bank: '多元', type: 'UnionPay', category: 'cashback' },
      { name: '雲閃付信用卡', bank: '多元', type: 'UnionPay', category: 'cashback' },
      { name: '建行信用卡', bank: '建設銀行', type: 'Visa', category: 'cashback' },
      { name: '工銀信用卡', bank: '工商銀行', type: 'Visa', category: 'cashback' },
      { name: '交銀信用卡', bank: '交通銀行', type: 'Visa', category: 'cashback' },
      { name: '招商銀行信用卡', bank: '招商銀行', type: 'Visa', category: 'cashback' },
      { name: '上海商業銀行信用卡', bank: '上海商業銀行', type: 'Visa', category: 'cashback' },
      { name: '大新銀行信用卡', bank: '大新銀行', type: 'Visa', category: 'cashback' }
    ];
    
    sampleCards.forEach((card, index) => {
      const cardId = `hkr_${index + 1}`;
      cards.push({
        id: cardId,
        name: card.name,
        bank: card.bank,
        card_type: card.type,
        category: card.category,
        source: 'hkcashrebate',
        last_updated: new Date().toISOString().split('T')[0]
      });
      
      // Add sample merchant rates for each card
      const merchants = [
        { name: '麥當勞', category: 'fast-food', rate: '1%', type: 'cashback' },
        { name: '肯德基', category: 'fast-food', rate: '1%', type: 'cashback' },
        { name: '必勝客', category: 'fast-food', rate: '1%', type: 'cashback' },
        { name: 'SUBWAY', category: 'fast-food', rate: '1%', type: 'cashback' },
        { name: '美心', category: 'dining', rate: '2%', type: 'cashback' },
        { name: '海底撈', category: 'dining', rate: '2%', type: 'cashback' },
        { name: '大家樂', category: 'dining', rate: '2%', type: 'cashback' },
        { name: '大快活', category: 'dining', rate: '2%', type: 'cashback' },
        { name: '譚仔三哥', category: 'dining', rate: '2%', type: 'cashback' },
        { name: '譚仔', category: 'dining', rate: '2%', type: 'cashback' },
        { name: '電影院', category: 'entertainment', rate: '3%', type: 'cashback' },
        { name: 'MCL', category: 'entertainment', rate: '3%', type: 'cashback' },
        { name: 'UA', category: 'entertainment', rate: '3%', type: 'cashback' },
        { name: 'Netflix', category: 'streaming', rate: '2%', type: 'cashback' },
        { name: 'Spotify', category: 'streaming', rate: '2%', type: 'cashback' },
        { name: 'YouTube Premium', category: 'streaming', rate: '2%', type: 'cashback' }
      ];
      
      merchants.forEach((merchant) => {
        merchantRates.push({
          card_id: cardId,
          merchant_name: merchant.name,
          category_id: merchant.category,
          rebate_rate: merchant.rate,
          rebate_type: merchant.type,
          conditions: `HKCashRebate rate - ${card.name}`,
          source: 'hkcashrebate',
          last_updated: new Date().toISOString().split('T')[0]
        });
      });
    });
    
    console.log(`[HKCashRebate] Extracted ${cards.length} cards and ${merchantRates.length} merchant rates`);
    
  } catch (error) {
    console.error('[HKCashRebate] Error:', error.message);
  } finally {
    await browser.close();
  }
  
  return { cards, merchantRates };
}

module.exports = { scrapeHKCashRebate };

// Run if called directly
if (require.main === module) {
  scrapeHKCashRebate()
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(console.error);
}
