/**
 * Credit Card Rebate Scraper - Main Entry
 * 信用卡回贈數據爬蟲 - 主程式
 * 
 * 自動搜集信用卡回贈數據從:
 * - MoneyHero.com.hk
 * - HongKongCard.com
 * - HKCashRebate.com
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
  const sources = ['moneyhero', 'hongkongcard', 'hkcashrebate'];
  
  // Run each scraper sequentially
  try {
    console.log('📡 Scraping MoneyHero.com.hk...');
    const moneyHeroData = await scrapeMoneyHero();
    allCards.push(...moneyHeroData.cards);
    allMerchantRates.push(...moneyHeroData.merchantRates);
  } catch (error) {
    console.error('❌ MoneyHero scraper failed:', error.message);
  }
  
  try {
    console.log('📡 Scraping HongKongCard.com...');
    const hkCardData = await scrapeHongKongCard();
    allCards.push(...hkCardData.cards);
    allMerchantRates.push(...hkCardData.merchantRates);
  } catch (error) {
    console.error('❌ HongKongCard scraper failed:', error.message);
  }
  
  try {
    console.log('📡 Scraping HKCashRebate.com...');
    const hkCashData = await scrapeHKCashRebate();
    allCards.push(...hkCashData.cards);
    allMerchantRates.push(...hkCashData.merchantRates);
  } catch (error) {
    console.error('❌ HKCashRebate scraper failed:', error.message);
  }
  
  const today = new Date().toISOString().split('T')[0];
  
  // Create final output
  const output = {
    cards: allCards,
    merchant_rates: allMerchantRates,
    last_updated: today,
    sources: sources,
    summary: {
      total_cards: allCards.length,
      total_merchant_rates: allMerchantRates.length,
      cards_by_source: {
        moneyhero: allCards.filter(c => c.source === 'moneyhero').length,
        hongkongcard: allCards.filter(c => c.source === 'hongkongcard').length,
        hkcashrebate: allCards.filter(c => c.source === 'hkcashrebate').length
      }
    }
  };
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Save JSON output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\n✅ JSON output saved to: ${OUTPUT_FILE}`);
  
  // Generate SQL for Supabase insertion
  const sql = generateSQL(output);
  fs.writeFileSync(SQL_FILE, sql);
  console.log(`✅ SQL output saved to: ${SQL_FILE}`);
  
  console.log('\n📊 Summary:');
  console.log(`   Total Cards: ${output.summary.total_cards}`);
  console.log(`   Total Merchant Rates: ${output.summary.total_merchant_rates}`);
  console.log(`   Last Updated: ${output.last_updated}`);
  
  return output;
}

/**
 * Generate SQL statements for Supabase insertion
 */
function generateSQL(data) {
  let sql = `-- Credit Card Rebate Data
-- Generated: ${new Date().toISOString()}
-- Total Cards: ${data.cards.length}
-- Total Merchant Rates: ${data.merchant_rates.length}

-- Cards Table Insert (Upsert)
INSERT INTO cards (id, name, bank, card_type, category, source, last_updated)
VALUES
`;
  
  const cardValues = data.cards.map(card => {
    return `  ('${card.id}', '${card.name.replace(/'/g, "''")}', '${card.bank.replace(/'/g, "''")}', '${card.card_type}', '${card.category}', '${card.source}', '${card.last_updated}')`;
  }).join(',\n');
  
  sql += cardValues;
  sql += `
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  bank = EXCLUDED.bank,
  card_type = EXCLUDED.card_type,
  category = EXCLUDED.category,
  source = EXCLUDED.source,
  last_updated = EXCLUDED.last_updated;

-- Merchant Rates Table Insert (Upsert)
INSERT INTO merchant_rates (card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, source, last_updated)
VALUES
`;
  
  const rateValues = data.merchant_rates.map(rate => {
    return `  ('${rate.card_id}', '${rate.merchant_name.replace(/'/g, "''")}', '${rate.category_id}', '${rate.rebate_rate}', '${rate.rebate_type}', '${rate.conditions.replace(/'/g, "''")}', '${rate.source}', '${rate.last_updated}')`;
  }).join(',\n');
  
  sql += rateValues;
  sql += `
ON CONFLICT (card_id, merchant_name, category_id) DO UPDATE SET
  rebate_rate = EXCLUDED.rebate_rate,
  rebate_type = EXCLUDED.rebate_type,
  conditions = EXCLUDED.conditions,
  source = EXCLUDED.source,
  last_updated = EXCLUDED.last_updated;
`;
  
  return sql;
}

// Export for use as module
module.exports = { runAllScrapers, generateSQL };

// Run if called directly
if (require.main === module) {
  runAllScrapers()
    .then(result => {
      console.log('\n🎉 Scraping complete!');
    })
    .catch(error => {
      console.error('❌ Scraping failed:', error);
      process.exit(1);
    });
}
