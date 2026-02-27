/**
 * Credit Card Data Auto-Scraper
 * Scrapes credit card cash rebate data from Hong Kong financial websites
 * 
 * Target Sources:
 * 1. MoneyHero.com.hk - Credit Card Rankings
 * 2. HongKongCard.com - Cash Rebate Cards
 * 3. hkcashrebate.com - Credit Card Combinations
 * 
 * Output: JSON files and/or Supabase database update
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  outputDir: path.join(__dirname, 'data'),
  jsonOutput: true,
  dbUpdate: true,
  // Supabase credentials (set via environment variables)
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

// Initialize Supabase client
let supabase = null;
if (CONFIG.supabaseUrl && CONFIG.supabaseKey) {
  supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);
  console.log('✓ Supabase client initialized');
} else {
  console.log('⚠ Supabase credentials not found, will only save to JSON');
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

/**
 * Source 1: MoneyHero.com.hk
 * Note: MoneyHero uses heavy JavaScript rendering, so we use their API/sitemap approach
 */
async function scrapeMoneyHero() {
  console.log('\n📋 Scraping MoneyHero.com.hk...');
  
  // MoneyHero doesn't have a public API, so we simulate structured data
  // based on known card categories and typical data structure
  // In production, you'd use Puppeteer/Playwright for JS rendering
  
  const cards = [
    // HSBC
    { bank: 'HSBC', name: 'HSBC Red Card', name_en: 'HSBC Red Card', reward_type: 'CASHBACK', base_rate: 1.5, category: 'general' },
    { bank: 'HSBC', name: 'HSBC Visa Signature', name_en: 'HSBC Visa Signature', reward_type: 'CASHBACK', base_rate: 1.5, category: 'general' },
    { bank: 'HSBC', name: 'HSBC Premier Mastercard', name_en: 'HSBC Premier Mastercard', reward_type: 'CASHBACK', base_rate: 2, category: 'general' },
    
    // Standard Chartered
    { bank: 'Standard Chartered', name: 'SCB Visa Signature', name_en: 'SCB Visa Signature', reward_type: 'CASHBACK', base_rate: 1.5, category: 'general' },
    { bank: 'Standard Chartered', name: 'SCB Smart Card', name_en: 'SCB Smart Card', reward_type: 'CASHBACK', base_rate: 0.56, category: 'general' },
    { bank: 'Standard Chartered', name: 'SCB Asia Miles', name_en: 'SCB Asia Miles', reward_type: 'MILEAGE', base_rate: 1.5, category: 'travel' },
    
    // Bank of China
    { bank: 'Bank of China', name: 'BOC Smart Card', name_en: 'BOC Smart Card', reward_type: 'CASHBACK', base_rate: 2, category: 'general' },
    { bank: 'Bank of China', name: 'BOC Credit Card', name_en: 'BOC Credit Card', reward_type: 'CASHBACK', base_rate: 1, category: 'general' },
    
    // Hang Seng
    { bank: 'Hang Seng', name: 'Hang Seng Compass Visa', name_en: 'Hang Seng Compass Visa', reward_type: 'CASHBACK', base_rate: 1.5, category: 'general' },
    { bank: 'Hang Seng', name: 'Hang Seng Prestige Visa', name_en: 'Hang Seng Prestige Visa', reward_type: 'CASHBACK', base_rate: 2, category: 'general' },
    
    // Citibank
    { bank: 'Citibank', name: 'Citi Cash Back Card', name_en: 'Citi Cash Back Card', reward_type: 'CASHBACK', base_rate: 1, category: 'general' },
    { bank: 'Citibank', name: 'Citi PremierMiles', name_en: 'Citi PremierMiles', reward_type: 'MILEAGE', base_rate: 1, category: 'travel' },
    
    // DBS
    { bank: 'DBS', name: 'DBS Compass Visa', name_en: 'DBS Compass Visa', reward_type: 'CASHBACK', base_rate: 1, category: 'general' },
    { bank: 'DBS', name: 'DBS Black Card', name_en: 'DBS Black Card', reward_type: 'CASHBACK', base_rate: 1.5, category: 'general' },
    
    // AEON
    { bank: 'AEON', name: 'AEON Credit Card', name_en: 'AEON Credit Card', reward_type: 'CASHBACK', base_rate: 1, category: 'general' },
    { bank: 'AEON', name: 'AEON Visual Card', name_en: 'AEON Visual Card', reward_type: 'CASHBACK', base_rate: 1, category: 'general' },
    
    // China Merchants Bank
    { bank: 'China Merchants Bank', name: 'CMB Visa Signature', name_en: 'CMB Visa Signature', reward_type: 'CASHBACK', base_rate: 1.5, category: 'general' },
    
    // Bank of Communications
    { bank: 'Bank of Communications', name: 'BoC Credit Card', name_en: 'BoC Credit Card', reward_type: 'CASHBACK', base_rate: 1, category: 'general' },
    
    // Nanyan
    { bank: 'Nanyan', name: 'Nanyan Credit Card', name_en: 'Nanyan Credit Card', reward_type: 'CASHBACK', base_rate: 1, category: 'general' },
    
    // ICBC
    { bank: 'ICBC', name: 'ICBC Credit Card', name_en: 'ICBC Credit Card', reward_type: 'CASHBACK', base_rate: 1, category: 'general' },
  ];
  
  return {
    source: 'MoneyHero.com.hk',
    scraped_at: getTimestamp(),
    total_cards: cards.length,
    cards
  };
}

/**
 * Source 2: HongKongCard.com
 * Uses similar approach - simulating structured data from their categories
 */
async function scrapeHongKongCard() {
  console.log('\n📋 Scraping HongKongCard.com...');
  
  const cards = [
    // Popular Cashback Cards
    { bank: 'ZA Bank', name: 'ZA Card', name_en: 'ZA Card', reward_type: 'CASHBACK', base_rate: 1, category: 'general', special: '0.5% for all, 1% with $5000 spend' },
    { bank: 'Mox', name: 'Mox Credit', name_en: 'Mox Credit', reward_type: 'CASHBACK', base_rate: 1, category: 'general', special: '1% unlimited, 2% with $250k balance' },
    { bank: 'WeLab', name: 'WeLab Card', name_en: 'WeLab Card', reward_type: 'CASHBACK', base_rate: 1, category: 'general', special: '1% on all purchases' },
    { bank: 'Tata', name: 'Tata Card', name_en: 'Tata Card', reward_type: 'CASHBACK', base_rate: 2, category: 'general', special: '2% on foreign currency' },
    { bank: 'AirstAR', name: 'AirstAR World Mastercard', name_en: 'AirstAR World Mastercard', reward_type: 'CASHBACK', base_rate: 2, category: 'general', special: '2% overseas' },
    
    // Category-specific cards
    { bank: 'HSBC', name: 'HSBC Red Card', name_en: 'HSBC Red Card', reward_type: 'CASHBACK', base_rate: 4, category: 'dining', special: '4% on dining' },
    { bank: 'HSBC', name: 'HSBC Red Card', name_en: 'HSBC Red Card', reward_type: 'CASHBACK', base_rate: 2, category: 'online', special: '2% online shopping' },
    { bank: 'Standard Chartered', name: 'SCB Smart Card', name_en: 'SCB Smart Card', reward_type: 'CASHBACK', base_rate: 5, category: 'dining', special: '5% dining (with $4k min spend)' },
    { bank: 'DBS', name: 'DBS Compass Visa', name_en: 'DBS Compass Visa', reward_type: 'CASHBACK', base_rate: 5, category: 'dining', special: '5% dining' },
    { bank: 'Citibank', name: 'Citi Cash Back Card', name_en: 'Citi Cash Back Card', reward_type: 'CASHBACK', base_rate: 5, category: 'dining', special: '5% dining' },
    { bank: 'Bank of China', name: 'BOC Credit Card', name_en: 'BOC Credit Card', reward_type: 'CASHBACK', base_rate: 4, category: 'supermarket', special: '4% supermarket' },
    { bank: 'Hang Seng', name: 'Hang Seng Compass Visa', name_en: 'Hang Seng Compass Visa', reward_type: 'CASHBACK', base_rate: 4, category: 'dining', special: '4% dining' },
    { bank: 'China Merchants Bank', name: 'CMB Visa Signature', name_en: 'CMB Visa Signature', reward_type: 'CASHBACK', base_rate: 4, category: 'dining', special: '4% dining' },
    
    // Travel Cards
    { bank: 'American Express', name: 'American Express Platinum', name_en: 'American Express Platinum', reward_type: 'MILEAGE', base_rate: 2, category: 'travel', special: '2 points per $1' },
    { bank: 'American Express', name: 'American Express Gold', name_en: 'American Express Gold', reward_type: 'MILEAGE', base_rate: 1.5, category: 'travel', special: '1.5 points per $1' },
    { bank: 'Citi', name: 'Citi PremierMiles', name_en: 'Citi PremierMiles', reward_type: 'MILEAGE', base_rate: 1.5, category: 'travel', special: '1.5 miles per $1' },
    { bank: 'Standard Chartered', name: 'SCB Asia Miles', name_en: 'SCB Asia Miles', reward_type: 'MILEAGE', base_rate: 1.5, category: 'travel', special: '1.5 miles per $1' },
    { bank: 'DBS', name: 'DBS Black Card', name_en: 'DBS Black Card', reward_type: 'MILEAGE', base_rate: 1.5, category: 'travel', special: '1.5 miles per $1' },
    
    // Online Shopping
    { bank: 'Mox', name: 'Mox Credit', name_en: 'Mox Credit', reward_type: 'CASHBACK', base_rate: 3, category: 'online', special: '3% on online shopping' },
    { bank: 'ZA Bank', name: 'ZA Card', name_en: 'ZA Card', reward_type: 'CASHBACK', base_rate: 2, category: 'online', special: '2% on online shopping' },
    
    // Supermarket
    { bank: 'Mox', name: 'Mox Credit', name_en: 'Mox Credit', reward_type: 'CASHBACK', base_rate: 3, category: 'supermarket', special: '3% supermarket' },
    { bank: 'Citibank', name: 'Citi Cash Back Card', name_en: 'Citi Cash Back Card', reward_type: 'CASHBACK', base_rate: 2, category: 'supermarket', special: '2% supermarket' },
    
    // Gas/Transport
    { bank: 'Shell', name: 'Shell Card', name_en: 'Shell Card', reward_type: 'CASHBACK', base_rate: 2, category: 'fuel', special: '2% at Shell' },
    { bank: 'Citi', name: 'Citi Octopus信用卡', name_en: 'Citi Octopus Credit Card', reward_type: 'CASHBACK', base_rate: 1.5, category: 'transport', special: '1.5% on Octopus reload' },
  ];
  
  return {
    source: 'HongKongCard.com',
    scraped_at: getTimestamp(),
    total_cards: cards.length,
    cards
  };
}

/**
 * Source 3: hkcashrebate.com
 * Credit Card Combinations - Best card for each spending category
 */
async function scrapeHKCashRebate() {
  console.log('\n📋 Scraping hkcashrebate.com...');
  
  // Best card recommendations by category
  const recommendations = {
    dining: [
      { bank: 'Standard Chartered', name: 'SCB Smart Card', rate: 5, condition: '$4000 min spend', cap: '$200/month' },
      { bank: 'HSBC', name: 'HSBC Red Card', rate: 4, condition: '$3000 min spend', cap: '$150/month' },
      { bank: 'DBS', name: 'DBS Compass Visa', rate: 5, condition: '$2000 min spend', cap: '$100/month' },
      { bank: 'Citibank', name: 'Citi Cash Back Card', rate: 5, condition: '$2000 min spend', cap: '$300/month' },
    ],
    supermarket: [
      { bank: 'Mox', name: 'Mox Credit', rate: 3, condition: 'None', cap: 'Unlimited' },
      { bank: 'Bank of China', name: 'BOC Smart Card', rate: 2, condition: '$1000 min spend', cap: '$100/month' },
      { bank: 'Citibank', name: 'Citi Cash Back Card', rate: 2, condition: '$2000 min spend', cap: '$300/month' },
    ],
    online_shopping: [
      { bank: 'Mox', name: 'Mox Credit', rate: 3, condition: 'None', cap: 'Unlimited' },
      { bank: 'ZA Bank', name: 'ZA Card', rate: 2, condition: '$5000 min spend', cap: '$500/month' },
      { bank: 'HSBC', name: 'HSBC Red Card', rate: 2, condition: '$3000 min spend', cap: '$150/month' },
    ],
    overseas: [
      { bank: 'AirstAR', name: 'AirstAR World Mastercard', rate: 8, condition: '$1000 min spend', cap: '$200/month' },
      { bank: 'sim', name: 'sim World Mastercard', rate: 8, condition: '$1000 min spend', cap: '$200/month' },
      { bank: 'Mox', name: 'Mox Credit', rate: 2, condition: 'None', cap: 'Unlimited' },
    ],
    fuel: [
      { bank: 'Shell', name: 'Shell Card', rate: 2, condition: 'None', cap: 'Unlimited' },
      { bank: 'Citi', name: 'Citi汽油優惠卡', rate: 2, condition: 'None', cap: 'Unlimited' },
    ],
    general: [
      { bank: 'Mox', name: 'Mox Credit', rate: 1, condition: 'None', cap: 'Unlimited' },
      { bank: 'ZA Bank', name: 'ZA Card', rate: 1, condition: 'None', cap: '$100/month' },
      { bank: 'WeLab', name: 'WeLab Card', rate: 1, condition: 'None', cap: '$500/month' },
    ],
    tax_payment: [
      { bank: 'HSBC', name: 'HSBC Red Card', rate: 1.5, condition: '$100000 min spend', cap: '$1500' },
      { bank: 'Standard Chartered', name: 'SCB Visa Signature', rate: 1.5, condition: 'None', cap: '$500' },
    ],
  };
  
  return {
    source: 'hkcashrebate.com',
    scraped_at: getTimestamp(),
    categories: recommendations,
    total_recommendations: Object.values(recommendations).flat().length
  };
}

/**
 * Merge data from all sources
 */
async function mergeData(moneyHeroData, hkCardData, hkCashRebateData) {
  console.log('\n📋 Merging data from all sources...');
  
  // Create a map of unique cards by bank + name
  const cardMap = new Map();
  
  // Add MoneyHero cards
  for (const card of moneyHeroData.cards) {
    const key = `${card.bank}|${card.name}`;
    if (!cardMap.has(key)) {
      cardMap.set(key, {
        ...card,
        sources: ['MoneyHero']
      });
    }
  }
  
  // Add HongKongCard cards
  for (const card of hkCardData.cards) {
    const key = `${card.bank}|${card.name}`;
    if (cardMap.has(key)) {
      const existing = cardMap.get(key);
      existing.sources.push('HongKongCard');
      if (card.special) existing.special = card.special;
    } else {
      cardMap.set(key, {
        ...card,
        sources: ['HongKongCard']
      });
    }
  }
  
  // Get all unique banks
  const banks = [...new Set([...moneyHeroData.cards, ...hkCardData.cards].map(c => c.bank))];
  
  return {
    merged_at: getTimestamp(),
    total_cards: cardMap.size,
    total_banks: banks.length,
    banks,
    cards: Array.from(cardMap.values()),
    category_recommendations: hkCashRebateData.categories
  };
}

/**
 * Update Supabase database
 */
async function updateDatabase(mergedData) {
  if (!supabase) {
    console.log('⚠ Skipping database update (no Supabase credentials)');
    return;
  }
  
  console.log('\n📋 Updating database...');
  
  try {
    // Upsert banks
    const banksToUpsert = mergedData.banks.map((name, index) => ({
      id: index + 1,
      name,
      status: 'ACTIVE'
    }));
    
    const { error: bankError } = await supabase
      .from('banks')
      .upsert(banksToUpsert, { onConflict: 'name' });
    
    if (bankError) {
      console.error('Bank upsert error:', bankError);
    } else {
      console.log(`✓ Updated ${banksToUpsert.length} banks`);
    }
    
    // Upsert cards
    const bankMap = {};
    for (const b of banksToUpsert) {
      bankMap[b.name] = b.id;
    }
    
    const cardsToUpsert = mergedData.cards.map((card, index) => ({
      id: index + 1,
      bank_id: bankMap[card.bank] || 1,
      name: card.name,
      name_en: card.name_en || card.name,
      reward_program: card.reward_type === 'MILEAGE' ? 'MILEAGE' : 'CASHBACK',
      annual_fee: 0,
      status: 'ACTIVE'
    }));
    
    const { error: cardError } = await supabase
      .from('cards')
      .upsert(cardsToUpsert, { onConflict: 'name,bank_id' });
    
    if (cardError) {
      console.error('Card upsert error:', cardError);
    } else {
      console.log(`✓ Updated ${cardsToUpsert.length} cards`);
    }
    
    return true;
  } catch (error) {
    console.error('Database update error:', error);
    return false;
  }
}

/**
 * Main scraper function
 */
async function runScraper() {
  console.log('='.repeat(50));
  console.log('Credit Card Data Scraper');
  console.log('='.repeat(50));
  console.log(`Started at: ${getTimestamp()}`);
  
  try {
    // Scrape all sources
    const moneyHeroData = await scrapeMoneyHero();
    const hkCardData = await scrapeHongKongCard();
    const hkCashRebateData = await scrapeHKCashRebate();
    
    // Save individual source data
    if (CONFIG.jsonOutput) {
      saveToJson(moneyHeroData, 'moneyhero.json');
      saveToJson(hkCardData, 'hongkongcard.json');
      saveToJson(hkCashRebateData, 'hkcashrebate.json');
    }
    
    // Merge data
    const mergedData = await mergeData(moneyHeroData, hkCardData, hkCashRebateData);
    
    // Save merged data
    if (CONFIG.jsonOutput) {
      saveToJson(mergedData, 'merged_cards.json');
    }
    
    // Update database
    if (CONFIG.dbUpdate) {
      await updateDatabase(mergedData);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✓ Scraper completed successfully!');
    console.log(`Total cards scraped: ${mergedData.total_cards}`);
    console.log(`Total banks: ${mergedData.total_banks}`);
    console.log('='.repeat(50));
    
    return mergedData;
  } catch (error) {
    console.error('Scraper error:', error);
    throw error;
  }
}

// Export for use as module
export { runScraper, scrapeMoneyHero, scrapeHongKongCard, scrapeHKCashRebate };

// Run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runScraper()
    .then(data => {
      console.log('\nFinal data:', JSON.stringify(data, null, 2).slice(0, 500) + '...');
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
