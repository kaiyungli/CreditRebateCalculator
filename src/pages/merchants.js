import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Merchants() {
  const [search, setSearch] = useState('');
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(false);

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
      </Head>

      <div style={{ minHeight: '100vh', background: 'var(--background)', padding: '20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '24px' }}>
          🔍 商戶發現
        </h1>

        {/* Search Bar */}
        <div style={{ marginBottom: '24px' }}>
          <input
            type="text"
            placeholder="搜尋商戶..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '16px',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              background: 'var(--card-bg)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* Merchant List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {merchants.map((merchant, index) => (
            <div
              key={index}
              style={{
                background: 'var(--card-bg)',
                borderRadius: '16px',
                padding: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
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
    </>
  );
}
