# Credit Card Rebate Scraper

自動搜集香港信用卡回贈數據的爬蟲工具。

## 數據來源

- [MoneyHero.com.hk](https://www.moneyhero.com.hk/en/credit-cards) - 信用卡比較
- [HongKongCard.com](https://www.hongkongcard.com) - 信用卡資訊
- [HKCashRebate.com](https://www.hkcashrebate.com) - 現金回贈資訊

## 安裝

```bash
cd CreditRebateCalculator
npm install
```

## 使用方法

```bash
# 執行所有爬蟲
node scrapers/index.js

# 執行單一爬蟲
node scrapers/moneyhero.js
node scrapers/hongkongcard.js
node scrapers/hkcashrebate.js
```

## Output

### JSON Output
`scrapers/output/credit-rebate-data.json`

### SQL Output  
`scrapers/output/merchant-rates.sql` - 可直接insert去Supabase

## Database Schema

### merchant_rates table
```sql
card_id, merchant_name, category_id, rebate_rate, rebate_type, conditions, status
```

### Categories
- 餐飲 (Dining) = category_id 1
- 超市 (Supermarket) = category_id 2
- 網購 (Online Shopping) = category_id 3
- 交通費 (Transport) = category_id 4
- 娛樂 (Entertainment) = category_id 5

## License

MIT
