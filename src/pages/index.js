import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      }
    } catch (err) {
      setError('計算失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>💳 香港信用卡回贈計算器</title>
        <meta name="description" content="比較信用卡回贈，找出最適合你的信用卡" />
      </Head>

      {/* 導航欄 */}
      <nav className="navbar container">
        <div style={{ fontSize: '24px', fontWeight: '800' }}>💳 CardCal</div>
        <div className="nav-links">
          <a href="/" className="nav-link">首頁</a>
          <a href="/cards" className="nav-link">信用卡比較</a>
          <a href="/calculate" className="nav-link">回贈計算</a>
        </div>
      </nav>

      {/* Hero 區域 */}
      <div className="hero container">
        <h1>找出最適合你的信用卡</h1>
        <p>香港首個智能信用卡回贈比較工具</p>
      </div>

      {/* 計算器區域 */}
      <div className="container">
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>
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
              color: '#374151'
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
              color: '#374151'
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
            className="btn-primary"
            style={{ width: '100%' }}
          >
            {loading ? '計算中...' : '🔥 找出最佳回贈'}
          </button>
        </div>

        {/* 計算結果 */}
        {results.length > 0 && (
          <div style={{ marginTop: '40px' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>
              📊 最佳回贈推薦
            </h3>
            
            <div style={{ display: 'grid', gap: '16px' }}>
              {results.map((card, index) => (
                <div 
                  key={card.id} 
                  className="card"
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
                    <p style={{ color: '#64748B', fontSize: '14px' }}>
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
                    <p style={{ color: '#64748B', fontSize: '14px' }}>
                      實際回贈率: {(card.effective_rate * 100).toFixed(2)}%
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
              <p style={{ color: '#64748B' }}>
                自動比較所有信用卡，找出最適合你的消費組合
              </p>
            </div>
            
            <div className="card feature-card">
              <div className="feature-icon">📱</div>
              <h4 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>
                覆蓋全面
              </h4>
              <p style={{ color: '#64748B' }}>
                涵蓋香港主要銀行，超過100張信用卡資料
              </p>
            </div>
            
            <div className="card feature-card">
              <div className="feature-icon">🔒</div>
              <h4 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>
                免費使用
              </h4>
              <p style={{ color: '#64748B' }}>
                所有核心功能完全免費，助你慳得更多
              </p>
            </div>
          </div>
        </div>

        {/* 統計數字 */}
        <div style={{ 
          marginTop: '60px', 
          padding: '40px', 
          background: 'white', 
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
        color: '#64748B',
        borderTop: '1px solid #E2E8F0'
      }}>
        <p>💳 CardCal - 香港信用卡回贈計算器</p>
        <p style={{ fontSize: '14px', marginTop: '8px' }}>
          數據僅供參考，請以銀行官方資料為準
        </p>
      </footer>
    </>
  );
}
