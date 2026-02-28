import ResultCard from './components/ResultCard';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { getUserCards } from '../lib/userCards';

export default function Calculate() {
  const router = useRouter();
  const { card_id: queryCardId } = router.query;

  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCard, setSelectedCard] = useState('');
  const [categories, setCategories] = useState([]);
  const [cards, setCards] = useState([]);
  const [userCardIds, setUserCardIds] = useState([]);
  const [showMyCardsOnly, setShowMyCardsOnly] = useState(false);
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
        
        // 載入用戶已選擇的卡
        const savedUserCards = getUserCards();
        setUserCardIds(savedUserCards);
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

    // 準備 card_ids 如果用戶選擇咗「我既卡」
    const cardIdsParam = showMyCardsOnly && userCardIds.length > 0 
      ? userCardIds 
      : undefined;

    try {
      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [{
            amount: parseFloat(amount),
            category_id: selectedCategory ? parseInt(selectedCategory) : null,
          }],
          card_ids: cardIdsParam,
        }),
      });
      
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else if (data.ok) {
        // Transform API response to match ResultCard format
        const transformedResults = data.plan.map((item, index) => ({
          id: index,
          categoryName: item.item.category_id ? getCategoryName(item.item.category_id) : '消費',
          categoryIcon: '💳',
          merchantName: null,
          amount: item.item.amount,
          bestCard: {
            bank_name: item.card.bank_name,
            card_name: item.card.name,
            icon: '💳',
            base_rate: item.rule.rate_value / 100,
          },
          rebate: item.rewardHKD,
        }));

        setResult({
          results: transformedResults,
          totalAmount: transformedResults.reduce((sum, r) => sum + r.amount, 0),
          totalRebate: data.totalHKD,
        });
      }
    } catch (err) {
      setError('計算失敗，請稍後再試');
      console.error('Calculate error:', err);
    } finally {
      setLoading(false);
    }
  }

  function getCategoryName(categoryId) {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : '消費';
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
                <option key={cat.id} value={cat.id.toString()}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* 指定信用卡 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              color: '#374151'
            }}>
              指定信用卡（可留空以比較所有卡）
            </label>
            
            {/* Toggle: My Cards vs All Cards */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px', 
              marginBottom: '12px',
              padding: '12px 16px',
              background: '#F8FAFC',
              borderRadius: '8px'
            }}>
              <span style={{ fontWeight: '600', color: '#374151' }}>顯示:</span>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                cursor: 'pointer',
                color: showMyCardsOnly ? '#374151' : '#0066FF',
                fontWeight: showMyCardsOnly ? '400' : '600'
              }}>
                <input
                  type="radio"
                  name="cardFilter"
                  checked={!showMyCardsOnly}
                  onChange={() => setShowMyCardsOnly(false)}
                  style={{ accentColor: '#0066FF' }}
                />
                全部卡
              </label>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                cursor: 'pointer',
                color: showMyCardsOnly ? '#0066FF' : '#374151',
                fontWeight: showMyCardsOnly ? '600' : '400'
              }}>
                <input
                  type="radio"
                  name="cardFilter"
                  checked={showMyCardsOnly}
                  onChange={() => setShowMyCardsOnly(true)}
                  style={{ accentColor: '#0066FF' }}
                />
                我既卡
              </label>
              {showMyCardsOnly && userCardIds.length > 0 && (
                <span style={{ 
                  fontSize: '12px', 
                  color: '#64748B',
                  background: '#E2E8F0',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  {userCardIds.length} 張
                </span>
              )}
              {showMyCardsOnly && userCardIds.length === 0 && (
                <span style={{ 
                  fontSize: '12px', 
                  color: '#DC2626',
                  background: '#FEE2E2',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  未選擇任何卡
                </span>
              )}
            </div>
            
            <select
              value={selectedCard}
              onChange={(e) => setSelectedCard(e.target.value)}
              className="input-field"
              style={{ cursor: 'pointer' }}
              disabled={showMyCardsOnly && userCardIds.length === 0}
            >
              <option value="">不限信用卡（自動推薦最佳卡片）</option>
              {(showMyCardsOnly 
                ? cards.filter(card => userCardIds.includes(card.id))
                : cards
              ).map((card) => (
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

        {/* 計算結果 - 使用 ResultCard 組件 */}
        {result && result.results && (
          <ResultCard
            results={result.results}
            totalAmount={result.totalAmount}
            totalRebate={result.totalRebate}
            onReset={() => {
              setResult(null);
              setAmount('');
              setSelectedCategory('');
              setSelectedCard('');
            }}
          />
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
