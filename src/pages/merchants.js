import { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from './components/Header';
import Footer from './components/Footer';
import { getAllMerchants, searchMerchant } from '../lib/merchantMappings';

export default function MerchantDiscovery() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [merchantOffers, setMerchantOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popularMerchants, setPopularMerchants] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  // Load popular merchants on mount
  useEffect(() => {
    // Popular merchants to show on landing
    const popular = [
      { name: '麥當勞', category: '餐飲美食', icon: '🍔', keywords: ['麥當勞', 'mcdonald'] },
      { name: '百佳', category: '超市便利店', icon: '🛒', keywords: ['百佳', 'parknshop'] },
      { name: '壽司郎', category: '餐飲美食', icon: '🍣', keywords: ['壽司郎', 'sushiro'] },
      { name: '淘寶', category: '網上購物', icon: '🛍️', keywords: ['淘寶', 'taobao'] },
      { name: '星巴克', category: '餐飲美食', icon: '☕', keywords: ['星巴克', 'starbucks'] },
      { name: '惠康', category: '超市便利店', icon: '🛒', keywords: ['惠康', 'wellcome'] },
      { name: '海底撈', category: '餐飲美食', icon: '🍲', keywords: ['海底撈'] },
      { name: 'HKTVmall', category: '網上購物', icon: '🛍️', keywords: ['hktvmall'] },
      { name: '7-11', category: '超市便利店', icon: '🏪', keywords: ['7-11', 'seven eleven'] },
      { name: '肯德基', category: '餐飲美食', icon: '🍗', keywords: ['肯德基', 'kfc'] },
    ];
    setPopularMerchants(popular);
  }, []);

  // Search handler
  useEffect(() => {
    if (query.length > 0) {
      const results = searchMerchant(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [query]);

  // Fetch merchant offers when merchant selected
  useEffect(() => {
    if (!selectedMerchant) return;

    async function fetchOffers() {
      setLoading(true);
      try {
        // Try to fetch from API
        const response = await fetch(`/api/merchant-rates?merchant_key=${encodeURIComponent(selectedMerchant.name)}`);
        const data = await response.json();
        
        if (data.merchantRates && data.merchantRates.length > 0) {
          // Group by merchant and format
          const offers = formatOffers(data.merchantRates);
          setMerchantOffers(offers);
        } else {
          // Use demo data if no API data
          const demoOffers = getDemoOffers(selectedMerchant.name);
          setMerchantOffers(demoOffers);
        }
      } catch (error) {
        console.error('Failed to fetch offers:', error);
        const demoOffers = getDemoOffers(selectedMerchant.name);
        setMerchantOffers(demoOffers);
      } finally {
        setLoading(false);
      }
    }

    fetchOffers();
  }, [selectedMerchant]);

  // Format API response
  function formatOffers(rates) {
    const cardMap = {};
    
    for (const rate of rates) {
      if (!cardMap[rate.card_id]) {
        cardMap[rate.card_id] = {
          cardId: rate.card_id,
          cardName: rate.card_name,
          rewardProgram: rate.reward_program,
          rewardKind: rate.reward_kind,
          rateValue: parseFloat(rate.rate_value) || 0,
          rateUnit: rate.rate_unit,
          perAmount: parseFloat(rate.per_amount) || 0,
          capValue: rate.cap_value,
          capPeriod: rate.cap_period,
        };
      }
    }
    
    // Convert to array and sort by rate value
    return Object.values(cardMap)
      .sort((a, b) => {
        const aRebate = calculateRebate(a);
        const bRebate = calculateRebate(b);
        return bRebate - aRebate;
      });
  }

  // Calculate rebate amount for display
  function calculateRebate(card) {
    if (card.rateUnit === 'PER_AMOUNT' && card.perAmount > 0) {
      return (card.rateValue / card.perAmount) * 100; // Convert to percentage
    }
    return card.rateValue * 100;
  }

  // Format rate display
  function formatRate(card) {
    if (card.rateUnit === 'PER_AMOUNT' && card.perAmount > 0) {
      return `HK$${card.perAmount.toFixed(0)}/${card.rateValue.toFixed(0)}里`;
    }
    return `${(card.rateValue * 100).toFixed(1)}%`;
  }

  // Demo offers when no API data
  function getDemoOffers(merchantName) {
    const demoData = {
      '麥當勞': [
        { cardId: 1, cardName: '滙豐 Visa Signature', rewardProgram: 'RewardCash', rewardKind: 'CASHBACK', rateValue: 0.04, rateUnit: 'PERCENTAGE', perAmount: 0, capValue: null },
        { cardId: 2, cardName: '渣打Smart卡', rewardProgram: 'Cash Back', rewardKind: 'CASHBACK', rateValue: 0.035, rateUnit: 'PERCENTAGE', perAmount: 0, capValue: 2000 },
        { cardId: 3, cardName: '中銀Visa太子卡', rewardProgram: 'Points', rewardKind: 'CASHBACK', rateValue: 0.03, rateUnit: 'PERCENTAGE', perAmount: 0, capValue: null },
        { cardId: 4, cardName: 'DBS Black Card', rewardProgram: 'Points', rewardKind: 'CASHBACK', rateValue: 0.025, rateUnit: 'PERCENTAGE', perAmount: 0, capValue: null },
      ],
      '百佳': [
        { cardId: 1, cardName: '滙豐 Visa Signature', rewardProgram: 'RewardCash', rewardKind: 'CASHBACK', rateValue: 0.02, rateUnit: 'PERCENTAGE', perAmount: 0, capValue: null },
        { cardId: 5, cardName: 'AE Explorer', rewardProgram: 'Points', rewardKind: 'POINTS', rateValue: 0.02, rateUnit: 'PERCENTAGE', perAmount: 0, capValue: null },
        { cardId: 2, cardName: '渣打Smart卡', rewardProgram: 'Cash Back', rewardKind: 'CASHBACK', rateValue: 0.02, rateUnit: 'PERCENTAGE', perAmount: 0, capValue: 2000 },
      ],
      '壽司郎': [
        { cardId: 1, cardName: '滙豐 Visa Signature', rewardProgram: 'RewardCash', rewardKind: 'CASHBACK', rateValue: 0.04, rateUnit: 'PERCENTAGE', perAmount: 0, capValue: null },
        { cardId: 3, cardName: '中銀Visa太子卡', rewardProgram: 'Points', rewardKind: 'CASHBACK', rateValue: 0.04, rateUnit: 'PERCENTAGE', perAmount: 0, capValue: null },
        { cardId: 6, cardName: 'Citi Prestige', rewardProgram: 'Points', rewardKind: 'CASHBACK', rateValue: 0.035, rateUnit: 'PERCENTAGE', perAmount: 0, capValue: null },
      ],
      '淘寶': [
        { cardId: 7, cardName: 'PayMe HSBC', rewardProgram: 'Payback', rewardKind: 'CASHBACK', rateValue: 0.02, rateUnit: 'PERCENTAGE', perAmount: 0, capValue: null },
        { cardId: 1, cardName: '滙豐 Visa Signature', rewardProgram: 'RewardCash', rewardKind: 'CASHBACK', rateValue: 0.02, rateUnit: 'PERCENTAGE', perAmount: 0, capValue: null },
        { cardId: 8, cardName: 'WeChat Pay', rewardProgram: 'Points', rewardKind: 'CASHBACK', rateValue: 0.015, rateUnit: 'PERCENTAGE', perAmount: 0, capValue: null },
      ],
      '星巴克': [
        { cardId: 1, cardName: '滙豐 Visa Signature', rewardProgram: 'RewardCash', rewardKind: 'CASHBACK', rateValue: 0.04, rateUnit: 'PERCENTAGE', perAmount: 0, capValue: null },
        { cardId: 9, cardName: '星巴克信用卡', rewardProgram: 'Star', rewardKind: 'POINTS', rateValue: 0, rateUnit: 'PER_AMOUNT', perAmount: 40, capValue: null },
        { cardId: 3, cardName: '中銀Visa太子卡', rewardProgram: 'Points', rewardKind: 'CASHBACK', rateValue: 0.03, rateUnit: 'PERCENTAGE', perAmount: 0, capValue: null },
      ],
      '惠康': [
        { cardId: 1, cardName: '滙豐 Visa Signature', rewardProgram: 'RewardCash', rewardKind: 'CASHBACK', rateValue: 0.02, rateUnit: 'PERCENTAGE', perAmount: 0, capValue: null },
        { cardId: 2, cardName: '渣打Smart卡', rewardProgram: 'Cash Back', rewardKind: 'CASHBACK', rateValue: 0.02, rateUnit: 'PERCENTAGE', perAmount: 0, capValue: 2000 },
      ],
      '海底撈': [
        { cardId: 1, cardName: '滙豐 Visa Signature', rewardProgram: 'RewardCash', rewardKind: 'CASHBACK', rateValue: 0.04, rateUnit: 'PERCENTAGE', perAmount: 0, capValue: null },
        { cardId: 10, cardName: '安信EarnMORE', rewardProgram: 'Cash Back', rewardKind: 'CASHBACK', rateValue: 0.04, rateUnit: 'PERCENTAGE', perAmount: 0, capValue: null },
      ],
      'HKTVmall': [
        { cardId: 1, cardName: '滙豐 Visa Signature', rewardProgram: 'RewardCash', rewardKind: 'CASHBACK', rateValue: 0.02, rateUnit: 'PERCENTAGE', perAmount: 0, capValue: null },
        { cardId: 11, cardName: 'MOX卡', rewardProgram: 'Cash Back', rewardKind: 'CASHBACK', rateValue: 0.02, rateUnit: 'PERCENTAGE', perAmount: 0, capValue: null },
        { cardId: 7, cardName: 'PayMe HSBC', rewardProgram: 'Payback', rewardKind: 'CASHBACK', rateValue: 0.015, rateUnit: 'PERCENTAGE', perAmount: 0, capValue: null },
      ],
      '7-11': [
        { cardId: 1, cardName: '滙豐 Visa Signature', rewardProgram: 'RewardCash', rewardKind: 'CASHBACK', rateValue: 0.02, rateUnit: 'PERCENTAGE', perAmount: 0, capValue: null },
        { cardId: 2, cardName: '渣打Smart卡', rewardProgram: 'Cash Back', rewardKind: 'CASHBACK', rateValue: 0.02, rateUnit: 'PERCENTAGE', perAmount: 0, capValue: 2000 },
        { cardId: 12, cardName: '恒生enJoy卡', rewardProgram: 'Cash Back', rewardKind: 'CASHBACK', rateValue: 0.02, rateUnit: 'PERCENTAGE', perAmount: 0, capValue: null },
      ],
      '肯德基': [
        { cardId: 1, cardName: '滙豐 Visa Signature', rewardProgram: 'RewardCash', rewardKind: 'CASHBACK', rateValue: 0.04, rateUnit: 'PERCENTAGE', perAmount: 0, capValue: null },
        { cardId: 3, cardName: '中銀Visa太子卡', rewardProgram: 'Points', rewardKind: 'CASHBACK', rateValue: 0.04, rateUnit: 'PERCENTAGE', perAmount: 0, capValue: null },
      ],
    };

    return demoData[merchantName] || [];
  }

  const handleMerchantClick = (merchant) => {
    setSelectedMerchant(merchant);
    setQuery(merchant.name);
    setSearchResults([]);
  };

  const clearSelection = () => {
    setSelectedMerchant(null);
    setQuery('');
    setMerchantOffers([]);
    setSearchResults([]);
  };

  return (
    <>
      <Head>
        <title>🏪 商戶發現 - 香港信用卡回贈計算器</title>
        <meta name="description" content="搜尋商戶優惠，搵出最高回贈信用卡" />
        <meta name="theme-color" content={darkMode ? '#1a1a2e' : '#0066FF'} />
      </Head>

      <div className={darkMode ? 'dark' : ''}>
        <Header 
          darkMode={darkMode} 
          setDarkMode={setDarkMode}
          userCards={[]}
          onOpenCardSelector={() => {}}
        />

        <div className="container">
          {/* Hero Section */}
          <div className="hero">
            <h1>🏪 商戶發現</h1>
            <p>搜尋商戶優惠，搵出邊張信用卡有最高回贈</p>
          </div>

          {/* Search Section */}
          <div className="search-section">
            <div className="search-container">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="輸入商戶名稱，例如：麥當勞、百佳、淘寶"
                className="search-input"
              />
              {query && (
                <button onClick={clearSelection} className="clear-btn">✕</button>
              )}
              
              {/* Search Suggestions */}
              {searchResults.length > 0 && (
                <div className="suggestions-dropdown">
                  {searchResults.map((merchant, idx) => (
                    <div
                      key={idx}
                      className="suggestion-item"
                      onClick={() => handleMerchantClick(merchant)}
                    >
                      <span className="suggestion-icon">{merchant.icon}</span>
                      <span className="suggestion-name">{merchant.name}</span>
                      <span className="suggestion-category">{merchant.category}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected Merchant Offers */}
          {selectedMerchant && !loading && (
            <div className="offers-section">
              <div className="merchant-header">
                <span className="merchant-icon">{selectedMerchant.icon}</span>
                <div className="merchant-info">
                  <h2>{selectedMerchant.name}</h2>
                  <span className="merchant-category">{selectedMerchant.category}</span>
                </div>
              </div>

              {merchantOffers.length > 0 ? (
                <div className="offers-list">
                  {merchantOffers.map((offer, idx) => (
                    <div 
                      key={offer.cardId} 
                      className={`offer-card ${idx === 0 ? 'best' : ''}`}
                    >
                      <div className="offer-rank">
                        {idx === 0 && <span className="best-badge">最高回贈</span>}
                        {idx === 1 && <span className="rank-badge">#{idx + 1}</span>}
                        {idx === 2 && <span className="rank-badge">#{idx + 1}</span>}
                        {idx > 2 && <span className="rank-badge">#{idx + 1}</span>}
                      </div>
                      
                      <div className="offer-details">
                        <div className="card-name">{offer.cardName}</div>
                        <div className="reward-info">
                          <span className="reward-kind">
                            {offer.rewardKind === 'CASHBACK' && '💰 回贈'}
                            {offer.rewardKind === 'POINTS' && '⭐ 積分'}
                            {offer.rewardKind === 'MILEAGE' && '✈️ 里數'}
                          </span>
                          <span className="rate-display">{formatRate(offer)}</span>
                        </div>
                        {offer.capValue && (
                          <div className="cap-info">每月上限: HK${offer.capValue}</div>
                        )}
                      </div>
                      
                      <div className="rebate-amount">
                        <div className="rebate-value">
                          {calculateRebate(offer).toFixed(1)}%
                        </div>
                        <div className="rebate-label">回贈率</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-offers">
                  <p>😕 暫時未有該商戶的優惠資料</p>
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>載入商戶優惠中...</p>
            </div>
          )}

          {/* Popular Merchants (when no search) */}
          {!selectedMerchant && query.length === 0 && (
            <div className="popular-section">
              <h3>🔥 熱門商戶</h3>
              <div className="popular-grid">
                {popularMerchants.map((merchant, idx) => (
                  <div
                    key={idx}
                    className="popular-item"
                    onClick={() => handleMerchantClick(merchant)}
                  >
                    <span className="popular-icon">{merchant.icon}</span>
                    <span className="popular-name">{merchant.name}</span>
                    <span className="popular-category">{merchant.category}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Footer />
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
        }

        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .hero {
          text-align: center;
          padding: 40px 24px;
          background: linear-gradient(135deg, #0066FF 0%, #00D4AA 100%);
          color: white;
          border-radius: 20px;
          margin-bottom: 32px;
        }

        .hero h1 {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .hero p {
          font-size: 16px;
          opacity: 0.9;
        }

        .search-section {
          margin-bottom: 32px;
        }

        .search-container {
          position: relative;
        }

        .search-input {
          width: 100%;
          padding: 18px 20px 18px 52px;
          border: 2px solid var(--border-color);
          border-radius: 16px;
          font-size: 16px;
          background: var(--card-bg);
          color: var(--text-primary);
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(0, 102, 255, 0.1);
        }

        .search-icon {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 20px;
        }

        .clear-btn {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 18px;
          padding: 4px 8px;
        }

        .suggestions-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--card-bg);
          border: 2px solid var(--primary);
          border-top: none;
          border-radius: 0 0 16px 16px;
          max-height: 240px;
          overflow-y: auto;
          z-index: 100;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        .suggestion-item {
          display: flex;
          align-items: center;
          padding: 14px 18px;
          cursor: pointer;
          border-bottom: 1px solid var(--border-color);
          transition: background 0.2s;
        }

        .suggestion-item:hover {
          background: rgba(0, 102, 255, 0.05);
        }

        .suggestion-item:last-child {
          border-bottom: none;
        }

        .suggestion-icon {
          font-size: 22px;
          margin-right: 14px;
        }

        .suggestion-name {
          flex: 1;
          font-weight: 600;
          font-size: 15px;
        }

        .suggestion-category {
          font-size: 12px;
          color: var(--text-secondary);
          background: var(--background);
          padding: 4px 10px;
          border-radius: 8px;
        }

        .offers-section {
          background: var(--card-bg);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .merchant-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-color);
        }

        .merchant-icon {
          font-size: 48px;
        }

        .merchant-info h2 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 4px 0;
        }

        .merchant-category {
          font-size: 14px;
          color: var(--text-secondary);
          background: var(--background);
          padding: 4px 12px;
          border-radius: 12px;
        }

        .offers-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .offer-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: var(--background);
          border-radius: 14px;
          border: 2px solid transparent;
          transition: all 0.2s;
        }

        .offer-card.best {
          background: linear-gradient(135deg, rgba(0, 212, 170, 0.1) 0%, rgba(0, 102, 255, 0.1) 100%);
          border-color: var(--secondary);
        }

        .offer-rank {
          min-width: 80px;
        }

        .best-badge {
          display: inline-block;
          background: linear-gradient(135deg, #00D4AA 0%, #00B894 100%);
          color: white;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
        }

        .rank-badge {
          display: inline-block;
          background: var(--card-bg);
          color: var(--text-secondary);
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
        }

        .offer-details {
          flex: 1;
        }

        .card-name {
          font-weight: 600;
          font-size: 15px;
          margin-bottom: 4px;
        }

        .reward-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }

        .reward-kind {
          color: var(--text-secondary);
        }

        .rate-display {
          color: var(--primary);
          font-weight: 600;
        }

        .cap-info {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 4px;
        }

        .rebate-amount {
          text-align: center;
          min-width: 70px;
        }

        .rebate-value {
          font-size: 22px;
          font-weight: 800;
          color: var(--primary);
        }

        .rebate-label {
          font-size: 11px;
          color: var(--text-secondary);
        }

        .loading-container {
          text-align: center;
          padding: 60px 20px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--border-color);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .no-offers {
          text-align: center;
          padding: 40px 20px;
          color: var(--text-secondary);
        }

        .popular-section {
          margin-top: 16px;
        }

        .popular-section h3 {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 16px;
          color: var(--text-primary);
        }

        .popular-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .popular-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: var(--card-bg);
          border-radius: 14px;
          cursor: pointer;
          border: 2px solid var(--border-color);
          transition: all 0.2s;
        }

        .popular-item:hover {
          border-color: var(--primary);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 102, 255, 0.15);
        }

        .popular-icon {
          font-size: 28px;
        }

        .popular-name {
          flex: 1;
          font-weight: 600;
          font-size: 14px;
        }

        .popular-category {
          font-size: 11px;
          color: var(--text-secondary);
          background: var(--background);
          padding: 3px 8px;
          border-radius: 6px;
        }

        @media (max-width: 600px) {
          .popular-grid {
            grid-template-columns: 1fr;
          }

          .offer-card {
            flex-wrap: wrap;
          }

          .offer-rank {
            min-width: auto;
          }

          .rebate-amount {
            width: 100%;
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid var(--border-color);
          }

          .rebate-value {
            font-size: 18px;
          }
        }
      `}</style>
    </>
  );
}
