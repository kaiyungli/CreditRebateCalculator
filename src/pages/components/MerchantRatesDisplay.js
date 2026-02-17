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
    if (userCards.length === 0 || !selectedCategory) {
      setMerchantRates([]);
      return;
    }

    async function fetchMerchantRates() {
      setLoading(true);
      setError(null);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const response = await fetch(
          `/api/merchant-rates?card_ids=${userCards.join(',')}&category_id=${selectedCategory}`,
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        if (data.success && data.merchants) {
          setMerchantRates(data.merchants);
        }
      } catch (error) {
        console.error('Failed to fetch merchant rates:', error);
        let errorMsg = '載入失敗';
        if (error.name === 'AbortError') {
          errorMsg = '請求超時，請稍後再試';
        } else if (error.message) {
          // Try to parse error details from API response
          try {
            if (error.message.includes('{')) {
              const parsed = JSON.parse(error.message.substring(error.message.indexOf('{')));
              if (parsed.error) {
                errorMsg = parsed.error;
                if (parsed.details) {
                  errorMsg += ` (${parsed.details.substring(0, 100)})`;
                }
              }
            } else {
              errorMsg = `錯誤: ${error.message.substring(0, 100)}`;
            }
          } catch (e) {
            errorMsg = `錯誤: ${error.message.substring(0, 100)}`;
          }
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

  if (!selectedCategory) {
    return (
      <div className="merchant-rates-empty">
        <p>📂 請先選擇消費類別</p>
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
                <div key={card.card_id} className="card-rate">
                  <div className="card-info">
                    <span className="card-name">{card.bank_name} {card.card_name}</span>
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
