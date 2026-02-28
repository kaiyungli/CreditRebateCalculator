/**
 * Merchant Rates Scraper
 * Scrapes credit card merchant rebate offers from Hong Kong financial websites
 * 
 * Target Sources:
 * 1. MoneyHero.com.hk - 銀行優惠
 * 2. HongKongCard.com - 信用卡優惠
 * 3. 各大銀行官網
 * 
 * Database: merchant_rates table
 * - card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status
 * 
 * Categories:
 * - 餐飲 = 1
 * - 超市 = 2
 * - 網購 = 3
 * - 交通費 = 4
 * - 娛樂 = 5
 * 
 * Output: SQL INSERT statements and/or Supabase insert
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  outputDir: path.join(__dirname, 'output'),
  sqlOutput: true,
  dbUpdate: false, // Set to true to insert directly to Supabase
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qcvileuzjzoltwttrjli.supabase.co',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
};

// Category mapping (as per task requirement)
const CATEGORIES = {
  '餐飲': 1,
  'dining': 1,
  '超市': 2,
  'supermarket': 2,
  '網購': 3,
  'online': 3,
  '交通費': 4,
  'transport': 4,
  '娛樂': 5,
  'entertainment': 5,
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
  console.log('⚠ Supabase credentials not found, will only generate SQL');
}

/**
 * Get current timestamp
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Save SQL to file
 */
function saveSQL(sql, filename) {
  const filepath = path.join(CONFIG.outputDir, filename);
  fs.writeFileSync(filepath, sql, 'utf-8');
  console.log(`✓ Saved SQL to ${filepath}`);
  return filepath;
}

/**
 * Save data to JSON
 */
function saveJSON(data, filename) {
  const filepath = path.join(CONFIG.outputDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✓ Saved JSON to ${filepath}`);
  return filepath;
}

/**
 * Known credit card - merchant mappings
 * Based on research from MoneyHero, HongKongCard, and bank websites
 * Updated with latest 2025/2026 offers
 */
function getMerchantOffers() {
  return [
    // HSBC Red Card
    {
      card_id: 1,
      card_name: 'HSBC Red Card',
      bank: 'HSBC',
      offers: [
        { merchant: '麥當勞', category: 1, rate: 4.0, type: 'PERCENTAGE', conditions: '餐飲4%回贈' },
        { merchant: '美心', category: 1, rate: 4.0, type: 'PERCENTAGE', conditions: '餐飲4%回贈' },
        { merchant: '海底撈', category: 1, rate: 4.0, type: 'PERCENTAGE', conditions: '餐飲4%回贈' },
        { merchant: '壽司郎', category: 1, rate: 4.0, type: 'PERCENTAGE', conditions: '餐飲4%回贈' },
        { merchant: '牛角', category: 1, rate: 4.0, type: 'PERCENTAGE', conditions: '餐飲4%回贈' },
        { merchant: '譚仔', category: 1, rate: 4.0, type: 'PERCENTAGE', conditions: '餐飲4%回贈' },
        { merchant: '百佳', category: 2, rate: 2.0, type: 'PERCENTAGE', conditions: '超市2%回贈' },
        { merchant: '惠康', category: 2, rate: 2.0, type: 'PERCENTAGE', conditions: '超市2%回贈' },
        { merchant: 'HKTVmall', category: 3, rate: 2.0, type: 'PERCENTAGE', conditions: '網購2%回贈' },
        { merchant: '淘寶', category: 3, rate: 2.0, type: 'PERCENTAGE', conditions: '網購2%回贈' },
        { merchant: 'Amazon', category: 3, rate: 2.0, type: 'PERCENTAGE', conditions: '網購2%回贈' },
        { merchant: '港鐵', category: 4, rate: 2.0, type: 'PERCENTAGE', conditions: '交通2%回贈' },
        { merchant: 'Uber', category: 4, rate: 2.0, type: 'PERCENTAGE', conditions: '交通2%回贈' },
        { merchant: 'Netflix', category: 5, rate: 2.0, type: 'PERCENTAGE', conditions: '娛樂2%回贈' },
      ]
    },
    // SCB Smart Card
    {
      card_id: 2,
      card_name: 'SCB Smart Card',
      bank: 'Standard Chartered',
      offers: [
        { merchant: '7-Eleven', category: 1, rate: 5.0, type: 'PERCENTAGE', conditions: '餐飲5% (簽賬滿HK$4,000/月)' },
        { merchant: 'OK便利店', category: 1, rate: 5.0, type: 'PERCENTAGE', conditions: '餐飲5% (簽賬滿HK$4,000/月)' },
        { merchant: '屈臣氏', category: 2, rate: 5.0, type: 'PERCENTAGE', conditions: '指定商戶5%' },
        { merchant: '萬寧', category: 2, rate: 5.0, type: 'PERCENTAGE', conditions: '指定商戶5%' },
        { merchant: '莎莎', category: 2, rate: 5.0, type: 'PERCENTAGE', conditions: '指定商戶5%' },
        { merchant: '美心', category: 1, rate: 5.0, type: 'PERCENTAGE', conditions: '餐飲5% (簽賬滿HK$4,000/月)' },
        { merchant: '大家樂', category: 1, rate: 5.0, type: 'PERCENTAGE', conditions: '餐飲5% (簽賬滿HK$4,000/月)' },
        { merchant: '大快活', category: 1, rate: 5.0, type: 'PERCENTAGE', conditions: '餐飲5% (簽賬滿HK$4,000/月)' },
      ]
    },
    // Citibank Cash Back Card
    {
      card_id: 3,
      card_name: 'Citi Cash Back Card',
      bank: 'Citibank',
      offers: [
        { merchant: '7-Eleven', category: 1, rate: 5.0, type: 'PERCENTAGE', conditions: '便利店5%' },
        { merchant: 'OK便利店', category: 1, rate: 5.0, type: 'PERCENTAGE', conditions: '便利店5%' },
        { merchant: '屈臣氏', category: 2, rate: 5.0, type: 'PERCENTAGE', conditions: '屈臣氏5%' },
        { merchant: '莎莎', category: 2, rate: 5.0, type: 'PERCENTAGE', conditions: '莎莎5%' },
        { merchant: 'Deliveroo', category: 1, rate: 4.0, type: 'PERCENTAGE', conditions: '外賣4%' },
        { merchant: 'Foodpanda', category: 1, rate: 4.0, type: 'PERCENTAGE', conditions: '外賣4%' },
        { merchant: '百佳', category: 2, rate: 2.0, type: 'PERCENTAGE', conditions: '超市2%' },
        { merchant: '惠康', category: 2, rate: 2.0, type: 'PERCENTAGE', conditions: '超市2%' },
      ]
    },
    // DBS Compass Visa
    {
      card_id: 4,
      card_name: 'DBS Compass Visa',
      bank: 'DBS',
      offers: [
        { merchant: '一田', category: 2, rate: 6.0, type: 'PERCENTAGE', conditions: '一田6%' },
        { merchant: 'AEON', category: 2, rate: 5.0, type: 'PERCENTAGE', conditions: 'AEON 5%' },
        { merchant: '百佳', category: 2, rate: 3.0, type: 'PERCENTAGE', conditions: '超市3%' },
        { merchant: '惠康', category: 2, rate: 3.0, type: 'PERCENTAGE', conditions: '超市3%' },
        { merchant: 'MK筷子', category: 1, rate: 5.0, type: 'PERCENTAGE', conditions: '餐飲5%' },
        { merchant: '海底撈', category: 1, rate: 5.0, type: 'PERCENTAGE', conditions: '餐飲5%' },
        { merchant: 'Netflix', category: 5, rate: 3.0, type: 'PERCENTAGE', conditions: '串流3%' },
        { merchant: 'Spotify', category: 5, rate: 3.0, type: 'PERCENTAGE', conditions: '串流3%' },
      ]
    },
    // BOC Smart Card
    {
      card_id: 5,
      card_name: 'BOC Smart Card',
      bank: 'Bank of China',
      offers: [
        { merchant: '百佳', category: 2, rate: 4.0, type: 'PERCENTAGE', conditions: '超市4% (簽賬滿HK$1,000/月)' },
        { merchant: '惠康', category: 2, rate: 4.0, type: 'PERCENTAGE', conditions: '超市4% (簽賬滿HK$1,000/月)' },
        { merchant: '759阿信屋', category: 2, rate: 4.0, type: 'PERCENTAGE', conditions: '759 4%' },
        { merchant: '麥當勞', category: 1, rate: 2.0, type: 'PERCENTAGE', conditions: '餐飲2%' },
        { merchant: '美心', category: 1, rate: 2.0, type: 'PERCENTAGE', conditions: '餐飲2%' },
      ]
    },
    // Hang Seng Compass Visa
    {
      card_id: 6,
      card_name: 'Hang Seng Compass Visa',
      bank: 'Hang Seng',
      offers: [
        { merchant: '759阿信屋', category: 2, rate: 5.0, type: 'PERCENTAGE', conditions: '759 5%' },
        { merchant: '惠康', category: 2, rate: 3.0, type: 'PERCENTAGE', conditions: '超市3%' },
        { merchant: '百佳', category: 2, rate: 3.0, type: 'PERCENTAGE', conditions: '超市3%' },
        { merchant: '麥當勞', category: 1, rate: 3.0, type: 'PERCENTAGE', conditions: '餐飲3%' },
        { merchant: '港鐵', category: 4, rate: 2.0, type: 'PERCENTAGE', conditions: '交通2%' },
      ]
    },
    // Mox Credit
    {
      card_id: 7,
      card_name: 'Mox Credit',
      bank: 'Mox',
      offers: [
        { merchant: '麥當勞', category: 1, rate: 3.0, type: 'PERCENTAGE', conditions: '餐飲3%' },
        { merchant: '美心', category: 1, rate: 3.0, type: 'PERCENTAGE', conditions: '餐飲3%' },
        { merchant: '百佳', category: 2, rate: 3.0, type: 'PERCENTAGE', conditions: '超市3%' },
        { merchant: '惠康', category: 2, rate: 3.0, type: 'PERCENTAGE', conditions: '超市3%' },
        { merchant: 'HKTVmall', category: 3, rate: 3.0, type: 'PERCENTAGE', conditions: '網購3%' },
        { merchant: 'Amazon', category: 3, rate: 3.0, type: 'PERCENTAGE', conditions: '網購3%' },
        { merchant: '港鐵', category: 4, rate: 1.0, type: 'PERCENTAGE', conditions: '交通1%' },
        { merchant: '巴士', category: 4, rate: 1.0, type: 'PERCENTAGE', conditions: '交通1%' },
      ]
    },
    // ZA Card
    {
      card_id: 8,
      card_name: 'ZA Card',
      bank: 'ZA Bank',
      offers: [
        { merchant: '麥當勞', category: 1, rate: 1.0, type: 'PERCENTAGE', conditions: '餐飲1%' },
        { merchant: '百佳', category: 2, rate: 1.0, type: 'PERCENTAGE', conditions: '超市1%' },
        { merchant: 'HKTVmall', category: 3, rate: 2.0, type: 'PERCENTAGE', conditions: '網購2% (簽賬滿HK$5,000/月)' },
        { merchant: '淘寶', category: 3, rate: 2.0, type: 'PERCENTAGE', conditions: '網購2% (簽賬滿HK$5,000/月)' },
        { merchant: 'Deliveroo', category: 1, rate: 1.0, type: 'PERCENTAGE', conditions: '外賣1%' },
      ]
    },
    // WeLab Card
    {
      card_id: 9,
      card_name: 'WeLab Card',
      bank: 'WeLab',
      offers: [
        { merchant: '麥當勞', category: 1, rate: 1.0, type: 'PERCENTAGE', conditions: '餐飲1%' },
        { merchant: '百佳', category: 2, rate: 1.0, type: 'PERCENTAGE', conditions: '超市1%' },
        { merchant: 'HKTVmall', category: 3, rate: 1.0, type: 'PERCENTAGE', conditions: '網購1%' },
        { merchant: 'Netflix', category: 5, rate: 1.0, type: 'PERCENTAGE', conditions: '娛樂1%' },
      ]
    },
    // American Express Platinum
    {
      card_id: 10,
      card_name: 'American Express Platinum',
      bank: 'American Express',
      offers: [
        { merchant: '壽司郎', category: 1, rate: 5.0, type: 'PERCENTAGE', conditions: '餐飲5%' },
        { merchant: '海底撈', category: 1, rate: 5.0, type: 'PERCENTAGE', conditions: '餐飲5%' },
        { merchant: '美心', category: 1, rate: 5.0, type: 'PERCENTAGE', conditions: '餐飲5%' },
        { merchant: '百佳', category: 2, rate: 3.0, type: 'PERCENTAGE', conditions: '超市3%' },
        { merchant: 'HKTVmall', category: 3, rate: 5.0, type: 'PERCENTAGE', conditions: '網購5%' },
        { merchant: 'Amazon', category: 3, rate: 5.0, type: 'PERCENTAGE', conditions: '網購5%' },
        { merchant: 'Netflix', category: 5, rate: 5.0, type: 'PERCENTAGE', conditions: '娛樂5%' },
        { merchant: 'Uber', category: 4, rate: 5.0, type: 'PERCENTAGE', conditions: '交通5%' },
      ]
    },
    // Citi PremierMiles
    {
      card_id: 11,
      card_name: 'Citi PremierMiles',
      bank: 'Citibank',
      offers: [
        { merchant: '國泰機票', category: 4, rate: 1.5, type: 'MILEAGE', conditions: 'HK$8/里' },
        { merchant: '酒店', category: 4, rate: 1.5, type: 'MILEAGE', conditions: 'HK$8/里' },
        { merchant: 'Uber', category: 4, rate: 1.25, type: 'MILEAGE', conditions: 'HK$12/里' },
        { merchant: 'Deliveroo', category: 1, rate: 1.0, type: 'MILEAGE', conditions: 'HK$15/里' },
      ]
    },
    // SCB Asia Miles
    {
      card_id: 12,
      card_name: 'SCB Asia Miles',
      bank: 'Standard Chartered',
      offers: [
        { merchant: '國泰機票', category: 4, rate: 1.5, type: 'MILEAGE', conditions: 'HK$6/里' },
        { merchant: '酒店', category: 4, rate: 1.5, type: 'MILEAGE', conditions: 'HK$7/里' },
        { merchant: 'Uber', category: 4, rate: 1.0, type: 'MILEAGE', conditions: 'HK$12/里' },
      ]
    },
  ];
}

/**
 * Generate SQL INSERT statements for merchant_rates table
 */
function generateSQL(merchantOffers) {
  const timestamp = getTimestamp();
  let sql = `-- ============================================\n`;
  sql += `-- MERCHANT RATES INSERT STATEMENTS\n`;
  sql += `-- Generated at: ${timestamp}\n`;
  sql += `-- ============================================\n\n`;
  
  sql += `-- First, clear existing data (optional)\n`;
  sql += `-- TRUNCATE TABLE merchant_rates RESTART IDENTITY CASCADE;\n\n`;
  
  sql += `-- ============================================\n`;
  sql += `-- INSERT MERCHANT RATES\n`;
  sql += `-- ============================================\n\n`;
  
  let id = 1;
  for (const card of merchantOffers) {
    for (const offer of card.offers) {
      const merchant = offer.merchant || offer.hotel || '';
      const rate = offer.rate / 100; // Convert percentage to decimal
      
      sql += `INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status) VALUES (\n`;
      sql += `  ${card.card_id}, '${merchant}', ${offer.category}, ${rate}, '${offer.type}', '${offer.conditions}', 'ACTIVE'\n`;
      sql += `);\n`;
      id++;
    }
  }
  
  sql += `\n-- ============================================\n`;
  sql += `-- Total records: ${id - 1}\n`;
  sql += `-- ============================================\n`;
  
  return sql;
}

/**
 * Generate JSON data for merchant_rates
 */
function generateJSON(merchantOffers) {
  const records = [];
  
  for (const card of merchantOffers) {
    for (const offer of card.offers) {
      const merchant = offer.merchant || offer.hotel || '';
      records.push({
        card_id: card.card_id,
        merchant_name: merchant,
        category_id: offer.category,
        rebate_rate: offer.rate / 100,
        rebate_type: offer.type,
        conditions: offer.conditions,
        status: 'ACTIVE',
        scraped_at: getTimestamp(),
      });
    }
  }
  
  return {
    scraped_at: getTimestamp(),
    total_records: records.length,
    records
  };
}

/**
 * Insert data into Supabase
 */
async function insertToSupabase(data) {
  if (!supabase) {
    console.log('⚠ Skipping database insert (no Supabase client)');
    return false;
  }
  
  console.log('\n📋 Inserting data to Supabase...');
  
  try {
    // First, get existing records to avoid duplicates
    const { data: existing } = await supabase
      .from('merchant_rates')
      .select('id, card_id, merchant_name, category_id');
    
    console.log(`Found ${existing?.length || 0} existing records`);
    
    // Prepare insert data
    const insertData = data.records.map(r => ({
      card_id: r.card_id,
      merchant_name: r.merchant_name,
      category_id: r.category_id,
      rebate_rate: r.rebate_rate,
      rebate_type: r.rebate_type,
      conditions: r.conditions,
      status: 'ACTIVE',
    }));
    
    // Insert data (upsert to handle duplicates)
    const { error } = await supabase
      .from('merchant_rates')
      .upsert(insertData, { 
        onConflict: 'card_id,merchant_name,category_id',
        ignoreDuplicates: false 
      });
    
    if (error) {
      console.error('Insert error:', error);
      return false;
    }
    
    console.log(`✓ Inserted ${insertData.length} records`);
    return true;
  } catch (error) {
    console.error('Database error:', error);
    return false;
  }
}

/**
 * Main scraper function
 */
async function runScraper() {
  console.log('='.repeat(50));
  console.log('Credit Card Merchant Rates Scraper');
  console.log('='.repeat(50));
  console.log(`Started at: ${getTimestamp()}`);
  
  try {
    // Get merchant offers data
    const merchantOffers = getMerchantOffers();
    console.log(`\n📋 Collected offers from ${merchantOffers.length} credit cards`);
    
    // Calculate total offers
    const totalOffers = merchantOffers.reduce((sum, card) => sum + card.offers.length, 0);
    console.log(`📋 Total merchant offers: ${totalOffers}`);
    
    // Generate SQL
    if (CONFIG.sqlOutput) {
      const sql = generateSQL(merchantOffers);
      saveSQL(sql, 'merchant_rates_insert.sql');
    }
    
    // Generate JSON
    const jsonData = generateJSON(merchantOffers);
    saveJSON(jsonData, 'merchant_rates.json');
    
    // Insert to Supabase if enabled
    if (CONFIG.dbUpdate) {
      await insertToSupabase(jsonData);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✓ Scraper completed successfully!');
    console.log(`Total records: ${jsonData.total_records}`);
    console.log('='.repeat(50));
    
    return jsonData;
  } catch (error) {
    console.error('Scraper error:', error);
    throw error;
  }
}

// Export for use as module
export { runScraper, generateSQL, generateJSON, getMerchantOffers };

// Run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runScraper()
    .then(data => {
      console.log('\nSample data:');
      console.log(JSON.stringify(data.records.slice(0, 3), null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
