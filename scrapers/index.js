/**
 * Credit Card Rebate Scraper - Main Entry
 * 信用卡回贈數據爬蟲 - 主程式
 * 
 * 數據來源:
 * - MoneyHero.com.hk
 * - HongKongCard.com
 * - HKCashRebate.com
 * 
 * Output: JSON + SQL for Supabase
 */

const fs = require('fs');
const path = require('path');
const { scrapeMoneyHero } = require('./moneyhero');
const { scrapeHongKongCard } = require('./hongkongcard');
const { scrapeHKCashRebate } = require('./hkcashrebate');

const OUTPUT_DIR = path.join(__dirname, 'output');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'credit-rebate-data.json');
const SQL_FILE = path.join(OUTPUT_DIR, 'merchant-rates.sql');

/**
 * Run all scrapers and combine results
 */
async function runAllScrapers() {
  console.log('🚀 Starting Credit Card Rebate Scrapers...\n');
  
  const allCards = [];
  const allMerchantRates = [];
  
  // Run each scraper
  try {
    console.log('📡 Scraping MoneyHero.com.hk...');
    const data = await scrapeMoneyHero();
    allCards.push(...data.cards);
    allMerchantRates.push(...data.merchantRates);
  } catch (error) {
    console.error('❌ MoneyHero failed:', error.message);
  }
  
  try {
    console.log('📡 Scraping HongKongCard.com...');
    const data = await scrapeHongKongCard();
    allCards.push(...data.cards);
    allMerchantRates.push(...data.merchantRates);
  } catch (error) {
    console.error('❌ HongKongCard failed:', error.message);
  }
  
  try {
    console.log('📡 Scraping HKCashRebate.com...');
    const data = await scrapeHKCashRebate();
    allCards.push(...data.cards);
    allMerchantRates.push(...data.merchantRates);
  } catch (error) {
    console.error('❌ HKCashRebate failed:', error.message);
  }
  
  const today = new Date().toISOString().split('T')[0];
  
  // Create output
  const output = {
    cards: allCards,
    merchant_rates: allMerchantRates,
    last_updated: today,
    summary: {
      total_cards: allCards.length,
      total_merchant_rates: allMerchantRates.length,
      sources: {
        moneyhero: allMerchantRates.filter(r => r.conditions?.includes('MoneyHero')).length,
        hongkongcard: allMerchantRates.filter(r => r.conditions?.includes('HongKongCard') || r.conditions?.includes('匯豐') || r.conditions?.includes('渣打') || r.conditions?.includes('恒生')).length,
        hkcashrebate: allMerchantRates.filter(r => r.conditions?.includes('EarnMORE') || r.conditions?.includes('TNG') || r.conditions?.includes('建行') || r.conditions?.includes('工銀') || r.conditions?.includes('招行')).length
      }
    }
  };
  
  // Ensure output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Save JSON
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\n✅ JSON saved: ${OUTPUT_FILE}`);
  
  // Generate SQL
  const sql = generateSQL(output);
  fs.writeFileSync(SQL_FILE, sql);
  console.log(`✅ SQL saved: ${SQL_FILE}`);
  
  console.log('\n📊 Summary:');
  console.log(`   Total Cards: ${output.summary.total_cards}`);
  console.log(`   Total Merchant Rates: ${output.summary.total_merchant_rates}`);
  console.log(`   Last Updated: ${output.last_updated}`);
  
  return output;
}

/**
 * Generate SQL INSERT statements for Supabase
 */
function generateSQL(data) {
  const today = new Date().toISOString().split('T')[0];
  
  let sql = `-- Credit Card Rebate Data
-- Generated: ${new Date().toISOString()}
-- Total Cards: ${data.cards.length}
-- Total Merchant Rates: ${data.merchant_rates.length}

-- ----------------------------
-- Cards Table (Upsert)
-- ----------------------------
INSERT INTO cards (card_id, name, bank, last_updated)
VALUES
`;
  
  const cardValues = data.cards.map(c => 
    `  ('${c.card_id}', '${c.name.replace(/'/g, "''")}', '${c.bank.replace(/'/g, "''")}', '${c.last_updated}')`
  ).join(',\n');
  
  sql += cardValues;
  sql += `
ON CONFLICT (card_id) DO UPDATE SET
  name = EXCLUDED.name,
  bank = EXCLUDED.bank,
  last_updated = EXCLUDED.last_updated;

-- ----------------------------
-- Merchant Rates Table (Upsert)
-- ----------------------------
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status)
VALUES
`;
  
  const rateValues = data.merchant_rates.map(r => 
    `  ('${r.card_id}', '${r.merchant_name.replace(/'/g, "''")}', ${r.category_id}, '${r.rebate_rate}', '${r.rebate_type}', '${r.conditions.replace(/'/g, "''")}', '${r.status}')`
  ).join(',\n');
  
  sql += rateValues;
  sql += `
ON CONFLICT (card_id, merchant_name, category_id) DO UPDATE SET
  rebate_rate = EXCLUDED.rebate_rate,
  rebate_type = EXCLUDED.rebate_type,
  conditions = EXCLUDED.conditions,
  status = EXCLUDED.status;
`;
  
  return sql;
}

module.exports = { runAllScrapers, generateSQL };

if (require.main === module) {
  runAllScrapers()
    .then(() => console.log('\n🎉 Scraping complete!'))
    .catch(err => {
      console.error('❌ Failed:', err);
      process.exit(1);
    });
}
