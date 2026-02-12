import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Cards() {
  const [cards, setCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // 載入信用卡
  useEffect(() => {
    async function loadCards() {
      try {
        const res = await fetch('/api/cards');
        const data = await res.json();
        if (data.cards) {
          setCards(data.cards);
          setFilteredCards(data.cards);
        }
      } catch (err) {
        console.error('載入信用卡失敗:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCards();
  }, []);

  // 篩選
  useEffect(() => {
    let result = cards;

    if (filterType !== 'ALL') {
      result = result.filter(card => card.card_type === filterType);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(card => 
        card.card_name?.toLowerCase().includes(term) ||
        card.bank_name?.toLowerCase().includes(term)
      );
    }

    setFilteredCards(result);
  }, [filterType, searchTerm, cards]);

  const cardTypes = [
    { value: 'ALL', label: '全部' },
    { value: 'CASHBACK', label: '💵 現金回贈' },
    { value: 'MILEAGE', label: '✈️ 飛行里數' },
    { value: 'POINTS', label: '🎁 積分' },
  ];

  return (
    <>
      <Head>
        <title>📱 信用卡比較 - CardCal</title>
        <meta name="description" content="比較香港各銀行信用卡回贈率" />
      </Head>

      {/* 導航欄 */}
      <nav className="navbar container">
        <div style={{ fontSize: '24px', fontWeight: '800' }}>💳 CardCal</div>
        <div className="nav-links">
          <a href="/" className="nav-link">首頁</a>
          <a href="/cards" className="nav-link" style={{ color: '#0066FF' }}>信用卡比較</a>
          <a href="/calculate" className="nav-link">回贈計算</a>
        </div>
      </nav>

      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>
            📱 信用卡比較
          </h1>
          <p style={{ color: '#64748B' }}>
            瀏覽並比較香港各銀行信用卡的回贈方案
          </p>
        </div>

        {/* 搜尋和篩選 */}
        <div className="card" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', marginBottom: '16px' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜尋信用卡名稱或銀行..."
              className="input-field"
            />
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-field"
              style={{ width: '200px', cursor: 'pointer' }}
            >
              {cardTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {cardTypes.map(type => (
              <button
                key={type.value}
                onClick={() => setFilterType(type.value)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  background: filterType === type.value ? '#0066FF' : '#F1F5F9',
                  color: filterType === type.value ? 'white' : '#64748B',
                  fontWeight: '500',
                  fontSize: '14px'
                }}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* 結果數量 */}
        <div style={{ marginBottom: '16px', color: '#64748B' }}>
          共 {filteredCards.length} 張信用卡
        </div>

        {/* 信用卡列表 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>
            載入中...
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ color: '#64748B' }}>沒有找到匹配的信用卡</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {filteredCards.map((card) => (
              <div key={card.id} className="card">
                {/* 卡類型標籤 */}
                <div style={{ marginBottom: '12px' }}>
                  <span className={`tag tag-${card.card_type?.toLowerCase()}`}>
                    {card.card_type === 'CASHBACK' ? '💵 現金回贈' : 
                     card.card_type === 'MILEAGE' ? '✈️ 飛行里數' : '🎁 積分'}
                  </span>
                </div>

                {/* 銀行和卡名 */}
                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>
                  {card.bank_name} {card.card_name}
                </h3>
                <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '16px' }}>
                  {card.card_type_name || '綜合回贈'}
                </p>

                {/* 詳細資訊 */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '12px',
                  padding: '16px',
                  background: '#F8FAFC',
                  borderRadius: '12px',
                  marginBottom: '16px'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>基本回贈</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#0066FF' }}>
                      {card.base_rate ? `${(card.base_rate * 100).toFixed(1)}%` : '-'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>年費</div>
                    <div style={{ fontSize: '18px', fontWeight: '700' }}>
                      {card.annual_fee === 0 ? '免年費' : `HK$${card.annual_fee}`}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>里數/積分</div>
                    <div style={{ fontSize: '18px', fontWeight: '700' }}>
                      {card.mileage_rate ? `${card.mileage_rate} 里/HKD` : '-'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>最低入息</div>
                    <div style={{ fontSize: '18px', fontWeight: '700' }}>
                      {card.income_required ? `HK$${card.income_required.toLocaleString()}` : '無要求'}
                    </div>
                  </div>
                </div>

                {/* 功能標籤 */}
                {card.features && card.features.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    {card.features.slice(0, 3).map((feature, idx) => (
                      <span 
                        key={idx}
                        style={{
                          padding: '4px 8px',
                          background: '#F1F5F9',
                          borderRadius: '6px',
                          fontSize: '12px',
                          color: '#64748B'
                        }}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                )}

                {/* 按鈕 */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <a 
                    href={`/calculate?card_id=${card.id}`}
                    className="btn-primary"
                    style={{ flex: 1, textAlign: 'center', textDecoration: 'none', padding: '12px' }}
                  >
                    計算回贈
                  </a>
                  {card.apply_url && (
                    <a 
                      href={card.apply_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                      style={{ flex: 1, textAlign: 'center', textDecoration: 'none', padding: '12px' }}
                    >
                      申請連結
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
