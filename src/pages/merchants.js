import { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from './components/Header';
import Hero from './components/Hero';
import Footer from './components/Footer';

export default function Merchants() {
  const [search, setSearch] = useState('');
  const [merchants, setMerchants] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  // Demo merchants data
  const DEMO_MERCHANTS = [
    { name: '麥當勞', category: '餐飲', icon: '🍔', rates: [
      { card: 'HSBC Visa Signature', rate: '4%', bank: 'HSBC' },
      { card: '渣打Smart卡', rate: '5%', bank: '渣打' },
      { card: 'Citi Rewards', rate: '5%', bank: 'Citi' },
    ]},
    { name: '百佳', category: '超市', icon: '🛒', rates: [
      { card: 'HSBC Visa Signature', rate: '2%', bank: 'HSBC' },
      { card: '渣打Smart卡', rate: '2%', bank: '渣打' },
    ]},
    { name: '壽司郎', category: '餐飲', icon: '🍣', rates: [
      { card: 'HSBC Visa Signature', rate: '4%', bank: 'HSBC' },
      { card: '渣打Smart卡', rate: '5%', bank: '渣打' },
    ]},
    { name: '淘寶', category: '網購', icon: '🛍️', rates: [
      { card: 'HSBC Visa Signature', rate: '2%', bank: 'HSBC' },
      { card: 'DBS Black Card', rate: '3%', bank: 'DBS' },
    ]},
    { name: '星巴克', category: '餐飲', icon: '☕', rates: [
      { card: 'HSBC Visa Signature', rate: '4%', bank: 'HSBC' },
    ]},
    { name: '惠康', category: '超市', icon: '🛒', rates: [
      { card: 'HSBC Visa Signature', rate: '2%', bank: 'HSBC' },
    ]},
    { name: '海底撈', category: '餐飲', icon: '🍲', rates: [
      { card: 'HSBC Visa Signature', rate: '4%', bank: 'HSBC' },
      { card: '渣打Smart卡', rate: '5%', bank: '渣打' },
    ]},
    { name: 'HKTVmall', category: '網購', icon: '🛍️', rates: [
      { card: 'HSBC Visa Signature', rate: '2%', bank: 'HSBC' },
    ]},
    { name: '7-11', category: '超市', icon: '🏪', rates: [
      { card: 'Citi Cash Back', rate: '5%', bank: 'Citi' },
    ]},
    { name: '肯德基', category: '餐飲', icon: '🍗', rates: [
      { card: 'HSBC Visa Signature', rate: '4%', bank: 'HSBC' },
    ]},
  ];

  useEffect(() => {
    if (search.length > 0) {
      const filtered = DEMO_MERCHANTS.filter(m => 
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.category.toLowerCase().includes(search.toLowerCase())
      );
      setMerchants(filtered);
    } else {
      setMerchants(DEMO_MERCHANTS);
    }
  }, [search]);

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
              style={{ width: '100%', marginBottom: '0' }}
            />
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
