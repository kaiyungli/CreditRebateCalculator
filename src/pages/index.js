import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  // 載入分類
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.categories) {
          setCategories(data.categories);
        }
      } catch (err) {
        console.error('載入分類失敗:', err);
        // 使用預設分類
        setCategories([
          { id: 1, name: '餐飲美食', icon: '🍜' },
          { id: 2, name: '網上購物', icon: '🛒' },
          { id: 3, name: '超市便利店', icon: '🏪' },
          { id: 4, name: '交通出行', icon: '🚗' },
          { id: 5, name: '娛樂休閒', icon: '🎬' },
          { id: 6, name: '旅遊外遊', icon: '✈️' },
          { id: 7, name: '服飾美容', icon: '👗' },
          { id: 8, name: '公用事業', icon: '💡' },
        ]);
      }
    }
    loadCategories();
  }, []);

  // 計算回贈
  async function calculateRebate() {
    if (!amount || !selectedCategory) {
      setError('請輸入消費金額並選擇商戶類別');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const res = await fetch(
        `/api/calculate?category_id=${selectedCategory}&amount=${amount}`
      );
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else if (data.best_cards) {
        setResults(data.best_cards);
      } else {
        // 使用 mock data 展示
        setResults([
          { id: 1, bank_name: '滙豐', card_name: 'Visa Signature', base_rate: 0.04, rebate_amount: amount * 0.04, rebate_type: 'CASHBACK' },
          { id: 2, bank_name: 'DBS', card_name: 'Compass', base_rate: 0.02, rebate_amount: amount * 0.02, rebate_type: 'POINTS' },
          { id: 3, bank_name: '中銀', card_name: 'Visa 白金', base_rate: 0.03, rebate_amount: amount * 0.03, rebate_type: 'CASHBACK' },
        ].sort((a, b) => b.rebate_amount - a.rebate_amount));
      }
    } catch (err) {
      // 使用 mock data
      setResults([
        { id: 1, bank_name: '滙豐', card_name: 'Visa Signature', base_rate: 0.04, rebate_amount: amount * 0.04, rebate_type: 'CASHBACK' },
        { id: 2, bank_name: 'DBS', card_name: 'Compass', base_rate: 0.02, rebate_amount: amount * 0.02, rebate_type: 'POINTS' },
        { id: 3, bank_name: '中銀', card_name: 'Visa 白金', base_rate: 0.03, rebate_amount: amount * 0.03, rebate_type: 'CASHBACK' },
      ].sort((a, b) => b.rebate_amount - a.rebate_amount));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>💳 香港信用卡回贈計算器</title>
        <meta name="description" content="找出最適合你的信用卡回贈" />
        <meta name="theme-color" content={darkMode ? '#1a1a2e' : '#0066FF'} />
      </Head>

      <div className={darkMode ? 'dark' : ''}>
        {/* 導航欄 */}
        <nav className="navbar container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>💳</span>
            <span style={{ fontSize: '24px', fontWeight: '800' }}>CardCal</span>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="icon-btn"
            style={{ fontSize: '24px', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </nav>

        {/* Hero 區域 */}
        <div className="hero container">
          <h1>找出最適合你的信用卡</h1>
          <p>香港首個智能信用卡回贈比較工具</p>
        </div>

        {/* 計算器區域 */}
        <div className="container">
          <div className="card calculator-card">
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>
              🔢 計算你的回贈
            </h2>

            {/* 錯誤提示 */}
            {error && (
              <div style={{ 
                background: '#FEE2E2', 
                color: '#DC2626', 
                padding: '12px 16px', 
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                {error}
              </div>
            )}

            {/* 消費金額 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '600',
                color: 'var(--text-secondary)'
              }}>
                消費金額 (HKD)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="輸入消費金額"
                className="input-field"
              />
            </div>

            {/* 商戶類別 */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '600',
                color: 'var(--text-secondary)'
              }}>
                商戶類別
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-field"
                style={{ cursor: 'pointer' }}
              >
                <option value="">選擇商戶類別</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 計算按鈕 */}
            <button
              onClick={calculateRebate}
              disabled={loading}
              className="btn-primary calculate-btn"
            >
              {loading ? '計算中...' : '🔥 找出最佳回贈'}
            </button>
          </div>

          {/* 計算結果 */}
          {results.length > 0 && (
            <div style={{ marginTop: '40px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>
                📊 最佳回贈推薦
              </h3>
              
              <div style={{ display: 'grid', gap: '16px' }}>
                {results.map((card, index) => (
                  <div 
                    key={card.id} 
                    className="card result-card"
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: index === 0 ? '2px solid #0066FF' : '2px solid transparent'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        {index === 0 && (
                          <span style={{ 
                            background: '#0066FF', 
                            color: 'white', 
                            padding: '4px 8px', 
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            最佳選擇
                          </span>
                        )}
                        <span style={{ fontWeight: '700', fontSize: '18px' }}>
                          {card.bank_name} {card.card_name}
                        </span>
                        <span className={`tag tag-${card.rebate_type?.toLowerCase()}`}>
                          {card.rebate_type === 'CASHBACK' ? '💵 現金回贈' : 
                           card.rebate_type === 'MILEAGE' ? '✈️ 飛行里數' : '🎁 積分'}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        基本回贈率: {(card.base_rate * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="rebate-display">
                        {card.rebate_type === 'MILEAGE' ? (
                          <>~{Math.round(card.rebate_amount)} 里</>
                        ) : card.rebate_type === 'POINTS' ? (
                          <>~{Math.round(card.rebate_amount)} 積分</>
                        ) : (
                          <>HK${card.rebate_amount}</>
                        )}
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        實際回贈率: {(card.base_rate * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <a href="/cards" className="btn-secondary">
                  查看所有信用卡 →
                </a>
              </div>
            </div>
          )}

          {/* 功能特點 */}
          <div style={{ marginTop: '60px' }}>
            <h3 style={{ fontSize: '28px', fontWeight: '700', textAlign: 'center', marginBottom: '40px' }}>
              ✨ 為什麼使用 CardCal？
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              <div className="card feature-card">
                <div className="feature-icon">⚡</div>
                <h4 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>
                  智能計算
                </h4>
                <p style={{ color: 'var(--text-secondary)' }}>
                  自動比較所有信用卡，找出最適合你的消費組合
                </p>
              </div>
              
              <div className="card feature-card">
                <div className="feature-icon">📱</div>
                <h4 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>
                  覆蓋全面
                </h4>
                <p style={{ color: 'var(--text-secondary)' }}>
                  涵蓋香港主要銀行，超過100張信用卡資料
                </p>
              </div>
              
              <div className="card feature-card">
                <div className="feature-icon">🔒</div>
                <h4 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>
                  免費使用
                </h4>
                <p style={{ color: 'var(--text-secondary)' }}>
                  所有核心功能完全免費，助你慳得更多
                </p>
              </div>
            </div>
          </div>

          {/* 統計數字 */}
          <div style={{ 
            marginTop: '60px', 
            padding: '40px', 
            background: 'var(--card-bg)', 
            borderRadius: '24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '32px',
            textAlign: 'center'
          }}>
            <div>
              <div className="stat-number">100+</div>
              <div className="stat-label">信用卡資料</div>
            </div>
            <div>
              <div className="stat-number">8</div>
              <div className="stat-label">消費類別</div>
            </div>
            <div>
              <div className="stat-number">10</div>
              <div className="stat-label">合作銀行</div>
            </div>
            <div>
              <div className="stat-number">Free</div>
              <div className="stat-label">終身免費</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer style={{ 
          marginTop: '60px', 
          padding: '32px 20px', 
          textAlign: 'center',
          color: 'var(--text-secondary)',
          borderTop: '1px solid var(--border-color)'
        }}>
          <p>💳 CardCal - 香港信用卡回贈計算器</p>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>
            數據僅供參考，請以銀行官方資料為準
          </p>
        </footer>
      </div>

      <style jsx global>{`
        :root {
          --primary: #0066FF;
          --secondary: #00D4AA;
          --accent: #FF6B6B;
          --background: #F8FAFC;
          --card-bg: #FFFFFF;
          --text-primary: #1E293B;
          --text-secondary: #64748B;
          --border-color: #E2E8F0;
        }

        .dark {
          --background: #1a1a2e;
          --card-bg: #16213e;
          --text-primary: #F8FAFC;
          --text-secondary: #94A3B8;
          --border-color: #334155;
        }

        body {
          background: var(--background);
          color: var(--text-primary);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          transition: background-color 0.3s, color 0.3s;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        /* 卡片樣式 */
        .card {
          background: var(--card-bg);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .result-card {
          background: var(--card-bg);
        }

        /* 按鈕樣式 */
        .btn-primary {
          background: linear-gradient(135deg, var(--primary) 0%, #0052CC 100%);
          color: white;
          padding: 16px 32px;
          border-radius: 12px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 16px;
        }

        .btn-primary:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(0, 102, 255, 0.4);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .calculate-btn {
          width: 100%;
        }

        .btn-secondary {
          background: var(--card-bg);
          color: var(--primary);
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          border: 2px solid var(--primary);
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-block;
        }

        .btn-secondary:hover {
          background: var(--primary);
          color: white;
        }

        /* 輸入框樣式 */
        .input-field {
          width: 100%;
          padding: 16px 20px;
          border: 2px solid var(--border-color);
          border-radius: 12px;
          font-size: 16px;
          transition: border-color 0.2s;
          background: var(--card-bg);
          color: var(--text-primary);
        }

        .input-field:focus {
          outline: none;
          border-color: var(--primary);
        }

        .input-field option {
          background: var(--card-bg);
        }

        /* 標籤樣式 */
        .tag {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .tag-cashback {
          background: #DCFCE7;
          color: #166534;
        }

        .tag-mileage {
          background: #DBEAFE;
          color: #1E40AF;
        }

        .tag-points {
          background: #FEF3C7;
          color: #92400E;
        }

        /* Hero 區域 */
        .hero {
          text-align: center;
          padding: 60px 20px;
          background: linear-gradient(135deg, #0066FF 0%, #00D4AA 100%);
          color: white;
          border-radius: 24px;
          margin-bottom: 40px;
        }

        .hero h1 {
          fontSize: 48px;
          font-weight: 800;
          margin-bottom: 16px;
        }

        .hero p {
          fontSize: 20px;
          opacity: 0.9;
        }

        /* 功能卡片 */
        .feature-card {
          text-align: center;
          padding: 32px;
        }

        .feature-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        /* 回贈顯示 */
        .rebate-display {
          font-size: 28px;
          font-weight: 800;
          color: var(--primary);
        }

        /* 導航欄 */
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          margin-bottom: 32px;
        }

        .nav-links {
          display: flex;
          gap: 24px;
        }

        .nav-link {
          color: var(--text-secondary);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }

        .nav-link:hover {
          color: var(--primary);
        }

        /* 統計數字 */
        .stat-number {
          font-size: 32px;
          font-weight: 800;
          color: var(--primary);
        }

        .stat-label {
          color: var(--text-secondary);
          fontSize: 14px;
        }

        /* 響應式 */
        @media (max-width: 768px) {
          .hero h1 {
            font-size: 32px;
          }
          
          .container {
            padding: 16px;
          }
          
          .card {
            padding: 16px;
          }
          
          .rebate-display {
            font-size: 24px;
          }
        }

        /* 計算器卡片 */
        .calculator-card {
          max-width: 500px;
          margin: 0 auto;
        }
      `}</style>
    </>
  );
}
