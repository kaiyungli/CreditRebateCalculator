import { useState, useEffect } from 'react';

export default function MerchantRatesDisplay({ 
  userCards = [], 
  selectedCategory,
  categories = [],
  onSelectMerchant
}) {
  const [merchantRates, setMerchantRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMerchant, setSelectedMerchant] = useState(null);

  // Fetch merchant rates when userCards or category changes
  useEffect(() => {
    if (userCards.length === 0) {
      setMerchantRates([]);
      return;
    }

    async function fetchMerchantRates() {
      setLoading(true);
      setError(null);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        // Build query params
        const params = new URLSearchParams();
        if (selectedCategory) {
          params.append('category_id', selectedCategory);
        }
        
        // Parse userCards safely (handle both object {id} and plain ID)
        const cardIds = (userCards || [])
          .map(c => (typeof c === 'object' && c !== null ? c.id : c))
          .map(n => Number(n))
          .filter(n => Number.isFinite(n));
        
        if (cardIds.length > 0) {
          params.append('card_ids', cardIds.join(','));
        }
        
        const response = await fetch(
          `/api/merchant-rates?${params.toString()}`,
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        // New format: flat array of rules, each with merchant info
        if (data.merchantRates) {
          // Group by merchant_name
          const grouped = {};
          for (const row of data.merchantRates) {
            const name = row.merchant_name;
            if (!grouped[name]) {
              grouped[name] = {
                merchant_name: name,
                merchant_key: row.merchant_key,
                default_category_id: row.default_category_id,
                cards: []
              };
            }
            
            // Format rate display
            let rateDisplay = '-';
            const rateVal = parseFloat(row.rate_value) || 0;
            const perAmount = parseFloat(row.per_amount) || 0;
            
            if (row.rate_unit === 'PER_AMOUNT' && perAmount > 0) {
              rateDisplay = `HK$${perAmount.toFixed(0)}/里`;
            } else if (rateVal > 0) {
              rateDisplay = `${(rateVal * 100).toFixed(1)}%`;
            }
            
            grouped[name].cards.push({
              rule_id: row.rule_id,
              card_id: row.card_id,
              card_name: row.card_name,
              reward_program: row.reward_program,
              reward_kind: row.reward_kind,
              rate_value: row.rate_value,
              rate_unit: row.rate_unit,
              per_amount: row.per_amount,
              cap_value: row.cap_value,
              cap_period: row.cap_period,
              min_spend: row.min_spend,
              rate_display: rateDisplay
            });
          }
          setMerchantRates(Object.values(grouped));
        }
      } catch (error) {
        console.error('Failed to fetch merchant rates:', error);
        let errorMsg = '載入失敗';
        if (error.name === 'AbortError') {
          errorMsg = '請求超時，請稍後再試';
        } else if (error.message) {
          errorMsg = `錯誤: ${error.message.substring(0, 100)}`;
        }
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }

    fetchMerchantRates();
  }, [userCards, selectedCategory]);

  const handleMerchantClick = (merchant) => {
    setSelectedMerchant(merchant.merchant_name);
    if (onSelectMerchant) {
      onSelectMerchant({
        name: merchant.merchant_name,
        merchant_key: merchant.merchant_key,
        default_category_id: merchant.default_category_id
      });
    }
  };

  if (userCards.length === 0) {
    return (
      <div className="merchant-rates-empty">
        <p>🎴 請先選擇您的信用卡</p>
        <style jsx>{`
          .merchant-rates-empty {
            text-align: center;
            padding: 40px 20px;
            background: var(--background, #F8FAFC);
            border-radius: 12px;
            color: var(--text-secondary, #64748B);
          }
        `}</style>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="merchant-rates-loading">
        <div className="loading-spinner"></div>
        <p>載入商戶回贈資料中...</p>
        <style jsx>{`
          .merchant-rates-loading {
            text-align: center;
            padding: 40px 20px;
            background: var(--background, #F8FAFC);
            border-radius: 12px;
          }
          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid var(--border-color, #E2E8F0);
            border-top-color: var(--primary, #0066FF);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="merchant-rates-error">
        <p>⚠️ 載入失敗</p>
        <p style={{ fontSize: '12px', marginTop: '8px' }}>{error}</p>
        <style jsx>{`
          .merchant-rates-error {
            text-align: center;
            padding: 40px 20px;
            background: #FEF2F2;
            border-radius: 12px;
            color: #DC2626;
          }
        `}</style>
      </div>
    );
  }

  if (merchantRates.length === 0) {
    return (
      <div className="merchant-rates-empty">
        <p>😕 暫時未有該類別的商戶回贈資料</p>
        <p style={{ fontSize: '14px', marginTop: '8px' }}>
          選擇其他類別或添加更多信用卡
        </p>
        <style jsx>{`
          .merchant-rates-empty {
            text-align: center;
            padding: 40px 20px;
            background: var(--background, #F8FAFC);
            border-radius: 12px;
            color: var(--text-secondary, #64748B);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="merchant-rates-container">
      <h3 style={{ 
        fontSize: '20px', 
        fontWeight: '700', 
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        🏪 商戶回贈比較
      </h3>

      <div className="merchant-list">
        {merchantRates.map((merchant) => (
          <div 
            key={merchant.merchant_name}
            className={`merchant-item ${selectedMerchant === merchant.merchant_name ? 'selected' : ''}`}
            onClick={() => handleMerchantClick(merchant)}
          >
            <div className="merchant-header">
              <span className="merchant-name">{merchant.merchant_name}</span>
              <span className="merchant-count">
                {merchant.cards.length} 張卡
              </span>
            </div>
            
            <div className="card-rates">
              {merchant.cards.map((card, idx) => (
                <div key={card.rule_id} className="card-rate">
                  <div className="card-info">
                    <span className="card-name">{card.card_name}</span>
                  </div>
                  <div className="rate-info">
                    <span className="rate-value">{card.rate_display}</span>
                    {idx === 0 && (
                      <span className="best-badge">最佳</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .merchant-rates-container {
          background: var(--card-bg, #FFFFFF);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
        }
        
        .merchant-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .merchant-item {
          background: var(--background, #F8FAFC);
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.2s;
        }
        
        .merchant-item:hover {
          border-color: var(--primary, #0066FF);
        }
        
        .merchant-item.selected {
          border-color: var(--primary, #0066FF);
          background: rgba(0, 102, 255, 0.05);
        }
        
        .merchant-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .merchant-name {
          font-weight: 700;
          font-size: 16px;
        }
        
        .merchant-count {
          font-size: 12px;
          color: var(--text-secondary, #64748B);
          background: var(--card-bg, #FFFFFF);
          padding: 4px 8px;
          border-radius: 12px;
        }
        
        .card-rates {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .card-rate {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: var(--card-bg, #FFFFFF);
          border-radius: 8px;
        }
        
        .card-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .card-name {
          font-size: 14px;
          color: var(--text-primary, #1E293B);
        }
        
        .rate-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .rate-value {
          font-weight: 700;
          color: var(--primary, #0066FF);
          font-size: 14px;
        }
        
        .best-badge {
          font-size: 10px;
          background: linear-gradient(135deg, #00D4AA, #0066FF);
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
