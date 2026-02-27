# Credit Card Auto-Scraper

自動搜集同更新香港信用卡回贈資料既 scraper。

## 功能

- 📥 自動 scrape 各大銀行信用卡回贈資料
- 💾 可以 save 去本地 JSON file
- 🗄️ 或者直接 update 去 Supabase database  
- ⏰ 可以設定定時自動 run (cron job)
- 🔄 可以透過 API trigger 更新

## 目標 Sources

1. **MoneyHero.com.hk** - 信用卡排名
2. **HongKongCard.com** - 現金回贈
3. **hkcashrebate.com** - 信用卡組合

## 安裝

```bash
cd scraper
npm install
```

## 環境變量

建立 `.env` 檔案：

```env
# Supabase (可選，唔設定既話只會 save JSON)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 使用方法

### Command Line

```bash
# Run scraper (JSON + DB update)
npm run scrape

# JSON only (skip DB update)
npm run scrape:json

# DB only (skip JSON output)
npm run scrape:db
```

### API Endpoint

```bash
# Trigger scraper via API
curl http://localhost:3000/api/scraper
```

### Cron Job

```bash
# Make script executable
chmod +x scraper-cron.sh

# Setup cron (daily at 6 AM)
crontab -e
0 6 * * * /path/to/scraper-cron.sh

# Or run manually
./scraper-cron.sh
```

## Output

Scraper 會生成以下 JSON 檔案：

```
scraper/data/
├── moneyhero.json      # MoneyHero 原始資料
├── hongkongcard.json  # HongKongCard 原始資料  
├── hkcashrebate.json  # hkcashrebate 原始資料
└── merged_cards.json   # 合併後既 data
```

## Database Schema

Scraper 會 update 以下既 database tables：

- `banks` - 銀行資料
- `cards` - 信用卡資料
- `reward_rules` - 回贈規則 (如果有用 merchant mappings 既話)

## 技術 Note

由於目標 websites 用左 JavaScript rendering，直接用 web_fetch 係 fetch 唔到既。所以：

1. **已提供 template data** - 基於已知既信用卡資料建立
2. **如果要用真正既 scrape**，需要用 Puppeteer/Playwright 等 headless browser
3. **Browser 可用既時候**，可以改用 browser automation

## License

MIT
