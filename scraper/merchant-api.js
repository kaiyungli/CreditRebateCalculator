/**
 * Merchant Discovery API
 * Provides functions to query merchant offers for the CreditRebateCalculator app
 * 
 * Data format:
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

// Data file path
const DATA_FILE = path.join(__dirname, 'data', 'merchants', 'merged_merchant_offers.json');

// In-memory cache
let cachedData = null;
let lastLoadTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Load merchant data from JSON file
 */
function loadData() {
  const now = Date.now();
  
  // Return cached data if still valid
  if (cachedData && (now - lastLoadTime) < CACHE_TTL) {
    return cachedData;
  }
  
  // Load fresh data
  try {
    const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
    cachedData = JSON.parse(rawData);
    lastLoadTime = now;
    return cachedData;
  } catch (error) {
    console.error('Error loading merchant data:', error);
    return null;
  }
}

/**
 * Get all merchant offers
 */
function getAllOffers() {
  const data = loadData();
  return data ? data.offers : [];
}

/**
 * Get offers by category
 * @param {string} category - Category key (dining, shopping, entertainment, etc.)
 */
function getOffersByCategory(category) {
  const data = loadData();
  if (!data) return [];
  
  return data.offers.filter(offer => offer.category_key === category);
}

/**
 * Get offers by bank
 * @param {string} bank - Bank name (HSBC, Citibank, DBS, etc.)
 */
function getOffersByBank(bank) {
  const data = loadData();
  if (!data) return [];
  
  const bankLower = bank.toLowerCase();
  return data.offers.filter(offer => 
    offer.bank.toLowerCase().includes(bankLower) || 
    bankLower.includes(offer.bank.toLowerCase())
  );
}

/**
 * Get offers for a specific merchant
 * @param {string} merchantName - Merchant name
 */
function getOffersByMerchant(merchantName) {
  const data = loadData();
  if (!data) return [];
  
  const nameLower = merchantName.toLowerCase();
  return data.offers.filter(offer => 
    offer.merchant_name.toLowerCase().includes(nameLower)
  );
}

/**
 * Search merchants/offers by keyword
 * @param {string} keyword - Search keyword
 */
function search(keyword) {
  const data = loadData();
  if (!data) return [];
  
  const keywordLower = keyword.toLowerCase();
  return data.offers.filter(offer => 
    offer.merchant_name.toLowerCase().includes(keywordLower) ||
    offer.offer.toLowerCase().includes(keywordLower) ||
    offer.bank.toLowerCase().includes(keywordLower) ||
    offer.category.toLowerCase().includes(keywordLower)
  );
}

/**
 * Get all unique categories
 */
function getCategories() {
  const data = loadData();
  return data ? data.categories : {};
}

/**
 * Get all unique banks
 */
function getBanks() {
  const data = loadData();
  if (!data) return [];
  
  return [...new Set(data.offers.map(o => o.bank))];
}

/**
 * Get all unique merchants
 */
function getMerchants() {
  const data = loadData();
  if (!data) return [];
  
  return [...new Set(data.offers.map(o => o.merchant_name))];
}

/**
 * Get best offer for a merchant (highest cashback)
 * @param {string} merchantName - Merchant name
 */
function getBestOfferForMerchant(merchantName) {
  const offers = getOffersByMerchant(merchantName);
  if (offers.length === 0) return null;
  
  // Parse cashback percentage from offer string
  const parseCashback = (offerStr) => {
    const match = offerStr.match(/(\d+)%/);
    return match ? parseInt(match[1]) : 0;
  };
  
  // Sort by cashback percentage
  offers.sort((a, b) => parseCashback(b.offer) - parseCashback(a.offer));
  
  return offers[0];
}

/**
 * Get data statistics
 */
function getStats() {
  const data = loadData();
  if (!data) return null;
  
  return {
    total_offers: data.total_offers,
    total_merchants: data.total_merchants,
    categories: Object.keys(data.categories).length,
    banks: getBanks().length,
    last_updated: data.merged_at
  };
}

/**
 * Reload data from file
 */
function reload() {
  cachedData = null;
  lastLoadTime = 0;
  return loadData();
}

export {
  getAllOffers,
  getOffersByCategory,
  getOffersByBank,
  getOffersByMerchant,
  search,
  getCategories,
  getBanks,
  getMerchants,
  getBestOfferForMerchant,
  getStats,
  reload
};
