import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Calculate() {
  const router = useRouter();
  const { card_id: queryCardId } = router.query;

  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCard, setSelectedCard] = useState('');
  const [categories, setCategories] = useState([]);
  const [cards, setCards] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 載入數據
  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, cardsRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/cards')
        ]);
        
        const catData = await catRes.json();
        const cardsData = await cardsRes.json();
        
        if (catData.categories) setCategories(catData.categories);
        if (cardsData.cards) setCards(cardsData.cards);
      } catch (err) {
        console.error('載入數據失敗:', err);
      }
    }
    loadData();
  }, []);

  // 設置初始選中的信用卡
  useEffect(() => {
    if (queryCardId && cards.length > 0) {
      const card = cards.find(c => c.id.toString() === queryCardId.toString());
      if (card) setSelectedCard(card.id);
    }
  }, [queryCardId, cards]);

  // 計算回贈
  async function calculate() {
    if (!amount) {
      setError('請輸入消費金額');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      let url = `/api/calculate?amount=${amount}`;
      if (selectedCategory) url += `&category_id=${selectedCategory}`;
      if (selectedCard) url += `&card_id=${selectedCard}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
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
        <title>🔢 回贈計算器 - CardCal</title>
        <meta name="description" content="計算信用卡回贈金額" />
      </Head>

      {/* 導航欄 */}
      <nav className="navbar container">
        <div style={{ fontSize: '24px', fontWeight: '800' }}>💳 CardCal</div>
        <div className="nav-links">
          <a href="/" className="nav-link">首頁</a>
          <a href="/cards" className="nav-link">信用卡比較</a>
          <a href="/calculate" className="nav-link" style={{ color: '#0066FF' }}>回贈計算</a>
        </div>
      </nav>

      <div className="container" style={{ maxWidth: '800px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px 🔢 詳細' }}>
           回贈計算
          </h1>
          <p style={{ color: '#64748B' }}>
            輸入消費資訊，計算可獲得的回贈
          </p>
        </div>

        {/* 計算表單 */}
        <div className="card" style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>
            📝 輸入消費資訊
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
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              color: '#374151'
            }}>
              商戶類別（可留空以比較所有卡）
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field"
              style={{ cursor: 'pointer' }}
            >
              <option value="">不限類別（自動推薦最佳卡片）</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* 指定信用卡 */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              color: '#374151'
            }}>
              指定信用卡（可留空以比較所有卡）
            </label>
            <select
              value={selectedCard}
              onChange={(e) => setSelectedCard(e.target.value)}
              className="input-field"
              style={{ cursor: 'pointer' }}
            >
              <option value="">不限信用卡（自動推薦最佳卡片）</option>
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.bank_name} {card.card_name}
                </option>
              ))}
            </select>
          </div>

          {/* 計算按鈕 */}
          <button
            onClick={calculate}
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%' }}
          >
            {loading ? '計算中...' : '🔥 計算回贈'}
          </button>
        </div>

        {/* 計算結果 */}
        {result && (
          <div className="card" style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>
              📊 計算結果
            </h2>

            {/* 單張卡結果 */}
            {result.card && (
              <div style={{ 
                padding: '24px', 
                background: 'linear-gradient(135deg, #0066FF 0%, #00D4AA 100%)',
                borderRadius: '16px',
                color: 'white',
                textAlign: 'center',
                marginBottom: '24px'
              }}>
                <div style={{ fontSize: '16px', opacity: 0.9, marginBottom: '8px' }}>
                  {result.bank_name} {result.card.name}
                </div>
                <div style={{ fontSize: '48px', fontWeight: '800', marginBottom: '8px' }}>
                  {result.rebate_type === 'MILEAGE' ? (
                    <>~{Math.round(result.rebate_amount)} 里</>
                  ) : result.rebate_type === 'POINTS' ? (
                    <>~{Math.round(result.rebate_amount)} 積分</>
                  ) : (
                    <>HK${result.rebate_amount}</>
                  )}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>
                  實際回贈率: {(result.effective_rate * 100).toFixed(2)}%
                </div>
              </div>
            )}

            {/* 多張卡結果 */}
            {result.best_cards && result.best_cards.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                  🏆 最佳推薦 TOP {result.best_cards.length}
                </h3>
                
                <div style={{ display: 'grid', gap: '12px' }}>
                  {result.best_cards.map((card, index) => (
                    <div 
                      key={card.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px',
                        background: index === 0 ? '#F0F9FF' : '#F8FAFC',
                        borderRadius: '12px',
                        border: index === 0 ? '2px solid #0066FF' : '2px solid transparent'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ 
                          width: '28px', 
                          height: '28px', 
                          background: index === 0 ? '#0066FF' : '#64748B',
                          color: 'white',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: '700'
                        }}>
                          {index + 1}
                        </span>
                        <div>
                          <div style={{ fontWeight: '600' }}>
                            {card.bank_name} {card.card_name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748B' }}>
                            回贈率: {(card.base_rate * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#0066FF' }}>
                          {card.rebate_type === 'MILEAGE' ? (
                            <>~{Math.round(card.rebate_amount)} 里</>
                          ) : card.rebate_type === 'POINTS' ? (
                            <>~{Math.round(card.rebate_amount)} 積分</>
                          ) : (
                            <>HK${card.rebate_amount}</>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 消費金額 */}
            {result.amount && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '16px',
                background: '#F8FAFC',
                borderRadius: '12px',
                marginTop: '16px'
              }}>
                <span style={{ color: '#64748B' }}>消費金額</span>
                <span style={{ fontWeight: '700' }}>HK${parseFloat(result.amount).toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        {/* 小提示 */}
        <div className="card" style={{ 
          background: '#FEF3C7', 
          border: 'none',
          borderLeft: '4px solid #F59E0B'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px', color: '#92400E' }}>
            💡 小提示
          </h3>
          <ul style={{ fontSize: '14px', color: '#92400E', paddingLeft: '20px' }}>
            <li>部分信用卡設有回贈上限，請留意条款细则</li>
            <li>外幣消費可能另設回贈率</li>
            <li>實際回贈可能受消費門檻影響</li>
            <li>數據僅供參考，請以銀行官方資料為準</li>
          </ul>
        </div>
      </div>
    </>
  );
}
