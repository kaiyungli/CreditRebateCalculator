import { useState, useEffect } from 'react';
import { searchMerchant, getAllMerchants } from '../../lib/merchantMappings';

export default function MerchantSearch({ 
  categories = [],
  onSelect,
  selectedMerchant,
  setSelectedMerchant 
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allMerchants] = useState(() => getAllMerchants());

  // 當輸入改變時，搜尋商戶
  useEffect(() => {
    if (query.length > 0) {
      const results = searchMerchant(query);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  // 選擇商戶
  function selectMerchant(merchant) {
    setQuery(merchant.name);
    setSelectedMerchant(merchant);
    setShowSuggestions(false);
    
    // 自動選擇對應的類別
    if (onSelect && merchant.category) {
      const category = categories.find(c => c.name === merchant.category);
      if (category) {
        onSelect(category.id.toString());
      }
    }
  }

  // 清除選擇
  function clearSelection() {
    setQuery('');
    setSelectedMerchant(null);
    setShowSuggestions(false);
    if (onSelect) onSelect('');
  }

  return (
    <div className="merchant-search">
      <label style={{ 
        display: 'block', 
        marginBottom: '8px', 
        fontWeight: '600',
        color: 'var(--text-secondary)'
      }}>
        商戶名稱（可選）
      </label>
      
      <div className="search-container">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 0 && setShowSuggestions(suggestions.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="輸入商戶名稱，例如：壽司郎、百佳、淘寶"
          className="search-input"
        />
        
        {query && (
          <button onClick={clearSelection} className="clear-btn">
            ✕
          </button>
        )}
        
        {/* 建議列表 */}
        {showSuggestions && (
          <div className="suggestions-list">
            {suggestions.map((merchant, index) => (
              <div
                key={index}
                className="suggestion-item"
                onClick={() => selectMerchant(merchant)}
              >
                <span className="suggestion-icon">{merchant.icon}</span>
                <span className="suggestion-name">{merchant.name}</span>
                <span className="suggestion-category">{merchant.category}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedMerchant && (
        <div className="selected-merchant">
          <span style={{ marginRight: '8px' }}>{selectedMerchant.icon}</span>
          <span>已選擇：<strong>{selectedMerchant.name}</strong></span>
          <span className="category-badge">{selectedMerchant.category}</span>
        </div>
      )}

      <style jsx>{`
        .merchant-search {
          margin-bottom: 16px;
        }
        
        .search-container {
          position: relative;
        }
        
        .search-input {
          width: 100%;
          padding: 16px 20px;
          padding-right: 40px;
          border: 2px solid var(--border-color);
          border-radius: 12px;
          font-size: 16px;
          background: var(--card-bg);
          color: var(--text-primary);
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        
        .search-input:focus {
          outline: none;
          border-color: var(--primary);
        }
        
        .clear-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 18px;
          padding: 4px 8px;
        }
        
        .suggestions-list {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--card-bg);
          border: 2px solid var(--primary);
          border-top: none;
          border-radius: 0 0 12px 12px;
          max-height: 200px;
          overflow-y: auto;
          z-index: 100;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .suggestion-item {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          cursor: pointer;
          border-bottom: 1px solid var(--border-color);
          transition: background 0.2s;
        }
        
        .suggestion-item:last-child {
          border-bottom: none;
        }
        
        .suggestion-item:hover {
          background: rgba(0, 102, 255, 0.05);
        }
        
        .suggestion-icon {
          font-size: 20px;
          margin-right: 12px;
        }
        
        .suggestion-name {
          flex: 1;
          font-weight: 500;
        }
        
        .suggestion-category {
          font-size: 12px;
          color: var(--text-secondary);
          background: var(--background);
          padding: 4px 8px;
          border-radius: 4px;
        }
        
        .selected-merchant {
          display: flex;
          align-items: center;
          margin-top: 12px;
          padding: 12px;
          background: rgba(0, 212, 170, 0.1);
          border-radius: 8px;
          font-size: 14px;
          color: var(--text-secondary);
        }
        
        .category-badge {
          margin-left: auto;
          padding: 4px 12px;
          background: var(--primary);
          color: white;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
