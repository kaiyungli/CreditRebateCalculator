# Credit Card Rebate Scraper

自動搜集信用卡回贈數據的爬蟲工具。

## 目標網站

- [MoneyHero.com.hk](https://www.moneyhero.com.hk/en/credit-cards) - 信用卡比較
- [HongKongCard.com](https://www.hongkongcard.com) - 信用卡資訊
- [HKCashRebate.com](https://www.hkcashrebate.com) - 現金回贈資訊

## 安裝

```bash
cd CreditRebateCalculator
npm install
```

## 使用方法

### 執行所有爬蟲

```bash
node scrapers/index.js
```

### 執行單一爬蟲

```bash
node scrapers/moneyhero.js
node scrapers/hongkongcard.js
node scrapers/hkcashrebate.js
```

## Output

### JSON Output

輸出到 `scrapers/output/credit-rebate-data.json`:

```json
{
  "cards": [
    {
      "id": "mh_1",
      "name": "HSBC Visa Signature",
      "bank": "HSBC",
      "card_type": "Visa",
      "category": "cashback",
      "source": "moneyhero",
      "last_updated": "2026-02-27"
    }
  ],
  "merchant_rates": [
    {
      "card_id": "mh_1",
      "merchant_name": "屈臣氏",
      "category_id": "health-beauty",
      "rebate_rate": "5%",
      "rebate_type": "cashback",
      "conditions": "MoneyHero rate - HSBC Visa Signature",
      "source": "moneyhero",
      "last_updated": "2026-02-27"
    }
  ],
  "last_updated": "2026-02-27",
  "sources": ["moneyhero", "hongkongcard", "hkcashrebate"],
  "summary": {
    "total_cards": 26,
    "total_merchant_rates": 208
  }
}
```

### SQL Output

輸出到 `scrapers/output/merchant-rates.sql`:

可直接插入 Supabase 的 SQL 語句，支援 upsert。

## 數據庫 Schema

預期 tables:

### cards

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Unique card ID |
| name | TEXT | Card name |
| bank | TEXT | Bank name |
| card_type | TEXT | Visa/Mastercard/Amex |
| category | TEXT | cashback/airmiles/etc |
| source | TEXT | moneyhero/hongkongcard/hkcashrebate |
| last_updated | DATE | Update date |

### merchant_rates

| Column | Type | Description |
|--------|------|-------------|
| card_id | TEXT | Reference to cards.id |
| merchant_name | TEXT | Merchant name |
| category_id | TEXT | Category (e.g., supermarket) |
| rebate_rate | TEXT | Rebate rate (e.g., "5%") |
| rebate_type | TEXT | cashback/points/airmiles |
| conditions | TEXT | Terms and conditions |
| source | TEXT | moneyhero/hongkongcard/hkcashrebate |
| last_updated | DATE | Update date |

## 定期執行

可以使用 cron 定期執行:

```bash
# 每天凌晨 6 點執行
0 6 * * * cd /path/to/CreditRebateCalculator && node scrapers/index.js >> scrapers.log 2>&1
```

## License

MIT
