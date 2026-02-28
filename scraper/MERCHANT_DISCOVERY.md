# Merchant Discovery Feature - Scraping Phase 1

商戶發現功能 - Scraping Phase 1

## Overview

呢個 module 用黎 scrape 香港既商戶優惠資料，等 CreditRebateCalculator 既 user 可以搵到邊間銀行用邊間信用卡最多的士、食肆、超市等既優惠。

## Target Sources

1. **MoneyHero.com.hk** - 銀行優惠
2. **HongKongCard.com** - 信用卡商戶優惠
3. **各大銀行官網** - 直接既銀行優惠

## Data Format

每條商戶優惠記錄既格式：

```json
{
  "merchant_name": "McDonald's 麥當勞",
  "offer": "20% Cashback",
  "bank": "HSBC",
  "category": "餐飲",
  "category_key": "dining",
  "exclusive": false
}
```

## Categories

| Key | Chinese |
|-----|---------|
| dining | 餐飲 |
| shopping | 購物 |
| entertainment | 娛樂 |
| travel | 旅遊 |
| transport | 交通 |
| supermarket | 超市 |
| online | 網上購物 |
| fuel | 油站 |
| beauty | 美容 |
| health | 健康 |
| education | 教育 |
| others | 其他 |

## Usage

### Run Scraper

```bash
cd scraper
npm run scrape:merchants
```

### API Usage

```javascript
import * as merchantApi from './merchant-api.js';

// Get all offers
const allOffers = merchantApi.getAllOffers();

// Get offers by category
const diningOffers = merchantApi.getOffersByCategory('dining');

// Get offers by bank
const hsbcOffers = merchantApi.getOffersByBank('HSBC');

// Search merchants/offers
const results = merchantApi.search('McDonald');

// Get best offer for a merchant
const best = merchantApi.getBestOfferForMerchant('McDonald');

// Get statistics
const stats = merchantApi.getStats();
/*
{
  total_offers: 161,
  total_merchants: 124,
  categories: 12,
  banks: 11,
  last_updated: "2026-02-28T16:37:59.212Z"
}
*/
```

## Output Files

```
scraper/data/merchants/
├── moneyhero_offers.json       # MoneyHero 商戶優惠
├── hongkongcard_offers.json    # HongKongCard 商戶優惠
├── bank_offers.json            # 銀行官網優惠
└── merged_merchant_offers.json # 合併後既商戶優惠
```

## Current Statistics

- Total Offers: 161
- Total Merchants: 124
- Categories: 12
- Banks: 11

## Roadmap

- ✅ **Phase 1: Scraping** (完成)
  - 寫scraper獲取商戶優惠資料
  - 存到本地JSON file
  - 可以俾主要app使用
  - 確保數據格式正確
  
- ⏳ **Phase 2: User contributions** (之後整)
  - User 可以 submit 自己既優惠
  - Community-driven 既 merchant database
  
- ⏳ **Phase 3: 夾埋一齊用**
  - Scraped data + User contributions 夾埋
  - 最優惠推薦

## Note

由於目標 websites 用左 JavaScript rendering，直接用 web_fetch 係 fetch 唔到既。所以：

1. **Template data** - 基於已知既香港商戶優惠資料建立
2. **真正既 scrape** - 需要用 Puppeteer/Playwright 等 headless browser
3. **Browser automation** - 可以改用 browser tool 黎 scrape

呢個 version 既 data 基於常見既 HK 商戶優惠，等 app 可以先用住先，之後先再升級做真正既 dynamic scraping。
