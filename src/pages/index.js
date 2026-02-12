import { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // 常見商戶映射
  const merchantMappings = {
    '壽司郎': { category: '餐飲美食', icon: '🍣' },
    '魚屋': { category: '餐飲美食', icon: '🍣' },
    '牛角': { category: '餐飲美食', icon: '🍖' },
    '牛扒': { category: '餐飲美食', icon: '🥩' },
    '餐廳': { category: '餐飲美食', icon: '🍽️' },
    '百佳': { category: '超市便利店', icon: '🛒' },
    '惠康': { category: '超市便利店', icon: '🛒' },
    '759': { category: '超市便利店', icon: '🛒' },
    '華潤': { category: '超市便利店', icon: '🛒' },
    '淘寶': { category: '網上購物', icon: '🛍️' },
    'Amazon': { category: '網上購物', icon: '📦' },
    'JD': { category: '網上購物', icon: '📦' },
    'Uber': { category: '交通出行', icon: '🚗' },
    'UberEats': { category: '餐飲美食', icon: '🍔' },
    'Deliveroo': { category: '餐飲美食', icon: '🍔' },
    'Foodpanda': { category: '餐飲美食', icon: '🍔' },
    '戲院': { category: '娛樂休閒', icon: '🎬' },
    'Cinema': { category: '娛樂休閒', icon: '🎬' },
    'Netflix': { category: '娛樂休閒', icon: '📺' },
    'Disney': { category: '娛樂休閒', icon: '🎬' },
  };

  // 商戶類別選項
  const categories = [
    { id: 1, name: '餐飲美食', icon: '🍜' },
    { id: 2, name: '網上購物', icon: '🛒' },
    { id: 3, name: '超市便利店', icon: '🏪' },
    { id: 4, name: '交通出行', icon: '🚗' },
    { id: 5, name: '娛樂休閒', icon: '🎬' },
    { id: 6, name: '旅遊外遊', icon: '✈️' },
    { id: 7, name: '服飾美容', icon: '👗' },
    { id: 8, name: '公用事業', icon: '💡' },
  ];

  // 新增多筆消費
  function addExpense() {
    if (!amount || !selectedCategory) return;
    
    const expense = {
      id: Date.now(),
      categoryId: selectedCategory,
      categoryName: categories.find(c => c.id.toString() === selectedCategory.toString())?.name || '其他',
      categoryIcon: categories.find(c => c.id.toString() === selectedCategory.toString())?.icon || '💳',
      amount: parseFloat(amount),
    };
    
    setExpenses([...expenses, expense]);
    setAmount('');
    setSelectedCategory('');
  }

  // 移除消費
  function removeExpense(id) {
    setExpenses(expenses.filter(e => e.id !== id));
  }

  // 計算最佳組合
  function calculateBestCombination() {
    if (expenses.length === 0) return;
    
    setLoading(true);
    
    // 模擬計算
    setTimeout(() => {
      const results = expenses.map(expense => {
        // Mock 計算邏輯
        const mockCards = [
          { id: 1, bank_name: '滙豐', card_name: 'Visa Signature', rebate_rate: 0.04 },
          { id: 2, bank_name: 'DBS', card_name: 'Compass', rebate_rate: 0.02 },
          { id: 3, bank_name: '中銀', card_name: 'Visa 白金', rebate_rate: 0.03 },
        ];
        
        const bestCard = mockCards.reduce((best, card) => {
          const currentRebate = expense.amount * card.rebate_rate;
          const bestRebate = expense.amount * best.rebate_rate;
          return currentRebate > bestRebate ? card : best;
        });
        
        return {
          ...expense,
          bestCard,
          rebate: expense.amount * bestCard.rebate_rate,
        };
      });
      
      setLoading(false);
      setResults(results);
    }, 1000);
  }

  const [results, setResults] = useState([]);

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRebate = results.reduce((sum, r) => sum + r.rebate, 0);

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
            style={{ fontSize: '24px', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </nav>

        {/* Hero 區域 */}
        <div className="hero container">
          <h1>找出最適合你的信用卡</h1>
          <p>輸入你想食嘢同買嘢的地方，幫你計算最佳回贈組合</p>
        </div>

        {/* 消費輸入區域 */}
        <div className="container">
          <div className="card calculator-card">
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>
              🛒 添加消費
            </h2>

            {/* 消費金額 */}
            <div style={{ marginBottom: '16px' }}>
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
                placeholder="輸入金額，例如：500"
                className="input-field"
              />
            </div>

            {/* 商戶類別 */}
            <div style={{ marginBottom: '16px' }}>
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
                <option value="">選擇類別</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 新增按鈕 */}
            <button
              onClick={addExpense}
              disabled={!amount || !selectedCategory}
              className="btn-primary calculate-btn"
              style={{ marginBottom: '24px' }}
            >
              ➕ 新增消費
            </button>

            {/* 已添加的消費列表 */}
            {expenses.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-secondary)' }}>
                  已添加 ({expenses.length})
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {expenses.map((expense, index) => (
                    <div 
                      key={expense.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        background: 'var(--background)',
                        borderRadius: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ 
                          width: '32px', 
                          height: '32px', 
                          background: 'var(--primary)', 
                          color: 'white',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                        }}>
                          {index + 1}
                        </span>
                        <div>
                          <div style={{ fontWeight: '600' }}>
                            {expense.categoryIcon} {expense.categoryName}
                          </div>
                          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            HK${expense.amount.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeExpense(expense.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#FF6B6B',
                          cursor: 'pointer',
                          fontSize: '20px',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* 總金額 */}
                <div style={{ 
                  marginTop: '16px', 
                  padding: '16px', 
                  background: 'linear-gradient(135deg, #0066FF 0%, #00D4AA 100%)',
                  borderRadius: '12px',
                  color: 'white',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>總消費金額</div>
                  <div style={{ fontSize: '28px', fontWeight: '800' }}>
                    HK${totalAmount.toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {/* 計算按鈕 */}
            <button
              onClick={calculateBestCombination}
              disabled={expenses.length === 0 || loading}
              className="btn-primary calculate-btn"
            >
              {loading ? '計算緊...' : '🔥 計算最佳組合'}
            </button>
          </div>

          {/* 計算結果 */}
          {results.length > 0 && (
            <div style={{ marginTop: '40px' }}>
              <h3 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>
                🎯 最佳信用卡組合
              </h3>

              {/* 總回贈 */}
              <div style={{ 
                marginBottom: '32px',
                padding: '32px', 
                background: 'linear-gradient(135deg, #00D4AA 0%, #0066FF 100%)',
                borderRadius: '20px',
                color: 'white',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '18px', opacity: 0.9, marginBottom: '8px' }}>
                  💰 總回贈
                </div>
                <div style={{ fontSize: '48px', fontWeight: '800' }}>
                  HK${totalRebate.toFixed(2)}
                </div>
                <div style={{ fontSize: '16px', opacity: 0.9, marginTop: '8px' }}>
                  實際回贈率: {((totalRebate / totalAmount) * 100).toFixed(2)}%
                </div>
              </div>

              {/* 每筆消費的最佳卡 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {results.map((result, index) => (
                  <div 
                    key={result.id}
                    className="card result-card"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <span style={{ 
                        width: '40px', 
                        height: '40px', 
                        background: 'var(--primary)', 
                        color: 'white',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        fontWeight: '700',
                      }}>
                        {index + 1}
                      </span>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '18px' }}>
                          {result.categoryIcon} {result.categoryName}
                        </div>
                        <div style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>
                          HK${result.amount.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      padding: '16px',
                      background: 'var(--background)',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <div>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                          建議使用
                        </div>
                        <div style={{ fontWeight: '700', fontSize: '18px', color: 'var(--primary)' }}>
                          {result.bestCard.bank_name} {result.bestCard.card_name}
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                          回贈率: {(result.bestCard.rebate_rate * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                          可獲回贈
                        </div>
                        <div style={{ fontWeight: '800', fontSize: '24px', color: '#00D4AA' }}>
                          HK${result.rebate.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 按鈕 */}
              <div style={{ marginTop: '24px', textAlign: 'center', display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <button
                  onClick={() => { setResults([]); setExpenses([]); }}
                  className="btn-secondary"
                >
                  🔄 重新計算
                </button>
                <a href="/cards" className="btn-primary">
                  查看所有信用卡 →
                </a>
              </div>
            </div>
          )}

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
          maxWidth: 800px;
          margin: 0 auto;
          padding: 20px;
        }

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

        .btn-primary {
          background: linear-gradient(135deg, var(--primary) 0%, #0052CC 100%);
          color: white;
          padding: 16px 32px;
          border-radius: 12px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          fontSize: 16px;
        }

        .btn-primary:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(0, 102, 255, 0.4);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .calculate-btn {
          width: 100%;
        }

        .btn-secondary {
          background: var(--card-bg);
          color: var(--primary);
          padding: 12px 24px;
          borderRadius: 12px;
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

        .input-field {
          width: 100%;
          padding: 16px 20px;
          border: 2px solid var(--border-color);
          border-radius: 12px;
          font-size: 16px;
          transition: border-color 0.2s;
          background: var(--card-bg);
          color: var(--text-primary);
          box-sizing: border-box;
        }

        .input-field:focus {
          outline: none;
          border-color: var(--primary);
        }

        .input-field option {
          background: var(--card-bg);
        }

        .hero {
          text-align: center;
          padding: 48px 24px;
          background: linear-gradient(135deg, #0066FF 0%, #00D4AA 100%);
          color: white;
          border-radius: 24px;
          margin-bottom: 40px;
        }

        .hero h1 {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 12px;
        }

        .hero p {
          font-size: 18px;
          opacity: 0.9;
        }

        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          margin-bottom: 32px;
        }

        @media (max-width: 768px) {
          .container {
            padding: 16px;
          }
          
          .card {
            padding: 20px;
          }
          
          .hero {
            padding: 32px 16px;
          }
          
          .hero h1 {
            font-size: 28px;
          }
        }

        .calculator-card {
          max-width: 100%;
        }
      `}</style>
    </>
  );
}
