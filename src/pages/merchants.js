import { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from './components/Header';
import Hero from './components/Hero';
import Footer from './components/Footer';

export default function Merchants() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [sortBy, setSortBy] = useState('rate');
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const CATEGORIES = [
    { id: '', name: '全部' },
    { id: '餐飲', name: '餐飲' },
    { id: '超市', name: '超市' },
    { id: '網購', name: '網購' },
  ];

  const UNIT_FILTERS = [
    { id: '', name: '全部' },
    { id: '%', name: '% 回贈' },
    { id: '$', name: '$ 優惠' },
    { id: '里', name: '里數' },
  ];

  // Fetch from API
  useEffect(() => {
    async function fetchMerchants() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (category) params.set('category', category);
        
        const res = await fetch(`/api/merchants?${params}`);
        const data = await res.json();
        
        if (data.merchants) {
          // Transform to display format
          let transformed = data.merchants.map(m => ({
            name: m.name,
            category_id: m.category_id,
            category: getCategoryName(m.category_id),
            icon: getCategoryIcon(m.category_id),
            rates: m.rates.map(r => ({
              card: r.card_name,
              rate: formatRate(r.rate, r.rate_type, r.offer_value, r.offer_type),
              bank: r.bank,
              offer_type: r.offer_type
            }))
          }));
          
          // Filter by unit if selected
          if (unitFilter) {
            transformed = transformed.map(m => ({
              ...m,
              rates: m.rates.filter(r => {
                if (unitFilter === '%') return r.rate.includes('%') && !r.rate.includes('折');
                if (unitFilter === '$') return r.rate.includes('$') || r.rate.includes('折');
                if (unitFilter === '里') return r.rate.includes('里');
                return true;
              })
            })).filter(m => m.rates.length > 0);
          }
          
          setMerchants(transformed);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchMerchants();
  }, [search, category, unitFilter, sortBy]);

  function getCategoryName(id) {
    const cats = { 1: '餐飲', 2: '超市', 3: '網購', 4: '交通費', 5: '娛樂' };
    return cats[id] || '其他';
  }
  
  function getCategoryIcon(id) {
    const icons = { 1: '🍜', 2: '🛒', 3: '🛍️', 4: '🚗', 5: '🎬' };
    return icons[id] || '💳';
  }
  
  function formatRate(rate, type, offerValue, offerType) {
    // If offer_value exists, use it directly
    if (offerValue) {
      const val = String(offerValue);
      if (val.includes('%')) return val;
      if (val.includes('折')) return val;
      if (val.includes('里')) return val;
      if (val.includes('$')) return val;
      // Check if it's a number
      const num = parseFloat(val);
      if (!isNaN(num)) {
        // Use offer_type to determine unit
        if (offerType === 'cashback' || offerType === 'COUPON') {
          if (num >= 10) return '$' + Math.round(num);
          return num + '%';
        }
        if (offerType === 'points' || offerType === 'MILEAGE') {
          return Math.round(num) + '里';
        }
        return num + '%';
      }
      return val;
    }
    
    // Fallback to old format
    if (type === 'PERCENTAGE' || type === 'PERCENT') {
      return (parseFloat(rate) * 100).toFixed(0) + '%';
    }
    return rate + (type === 'MILEAGE' ? '里' : '');
  }

  return (
    <>
      <Head>
        <title>💳 商戶發現 - CardCal</title>
        <meta name="description" content="搜尋商戶信用卡優惠" />
        <meta name="theme-color" content={darkMode ? '#1a1a2e' : '#0066FF'} />
      </Head>

      <div className={darkMode ? 'dark' : ''}>
        <Header 
          darkMode={darkMode} 
          setDarkMode={setDarkMode}
        />

        <Hero />

        <div className="container">
          {/* Search Section */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', textAlign: 'center' }}>
              🔍 搜尋商戶
            </h2>
            
            <input
              type="text"
              placeholder="輸入商戶名稱..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ width: '100%', marginBottom: '16px' }}
            />
            
            {/* Category Filter */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    background: category === cat.id ? 'var(--primary)' : 'var(--background)',
                    color: category === cat.id ? 'white' : 'var(--text-primary)',
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            
            {/* Unit Filter */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {UNIT_FILTERS.map(unit => (
                <button
                  key={unit.id}
                  onClick={() => setUnitFilter(unit.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '16px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    background: unitFilter === unit.id ? 'var(--primary)' : 'var(--background)',
                    color: unitFilter === unit.id ? 'white' : 'var(--text-primary)',
                  }}
                >
                  {unit.name}
                </button>
              ))}
            </div>
            
            {/* Sort */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>排序：</span>
              <button
                onClick={() => setSortBy('rate')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  background: sortBy === 'rate' ? 'var(--primary)' : 'var(--background)',
                  color: sortBy === 'rate' ? 'white' : 'var(--text-primary)',
                }}
              >
                回贈高至低
              </button>
              <button
                onClick={() => setSortBy('name')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  background: sortBy === 'name' ? 'var(--primary)' : 'var(--background)',
                  color: sortBy === 'name' ? 'white' : 'var(--text-primary)',
                }}
              >
                名稱順序
              </button>
            </div>
          </div>

          {/* Merchant List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {merchants.map((merchant, index) => (
              <div key={index} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '32px' }}>{merchant.icon}</span>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '600' }}>{merchant.name}</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{merchant.category}</div>
                  </div>
                </div>

                {/* Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {merchant.rates.map((rate, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        background: 'var(--background)',
                        borderRadius: '8px',
                      }}
                    >
                      <span style={{ fontWeight: '500' }}>{rate.card}</span>
                      <span style={{ 
                        color: 'var(--primary)', 
                        fontWeight: '700',
                        fontSize: '16px'
                      }}>
                        {rate.rate} 回贈
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {merchants.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              搵唔到相關商戶
            </div>
          )}
        </div>

        <Footer />
      </div>

      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        :root {
          --primary: #0066FF;
          --primary-dark: #0052cc;
          --background: #f8fafc;
          --card-bg: #ffffff;
          --text-primary: #1e293b;
          --text-secondary: #64748b;
          --border: #e2e8f0;
        }
        
        .dark {
          --background: #0f172a;
          --card-bg: #1e293b;
          --text-primary: #f1f5f9;
          --text-secondary: #94a3b8;
          --border: #334155;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: var(--background);
          color: var(--text-primary);
          line-height: 1.6;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .card {
          background: var(--card-bg);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        
        .input-field {
          width: 100%;
          padding: 14px 16px;
          font-size: 16px;
          border: 2px solid var(--border);
          border-radius: 12px;
          background: var(--card-bg);
          color: var(--text-primary);
          transition: border-color 0.2s;
        }
        
        .input-field:focus {
          outline: none;
          border-color: var(--primary);
        }

        .dark .input-field {
          background: var(--background);
          border-color: var(--border);
        }
      `}</style>
    </>
  );
}
