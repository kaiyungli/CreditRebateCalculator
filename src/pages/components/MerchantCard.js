import { useState } from 'react'

export default function MerchantCard({ merchant }) {
  const [expanded, setExpanded] = useState(false)
  
  if (!merchant) return null

  const { merchant_name, all_rates, best_rate } = merchant

  // Format rebate rate for display
  const formatRate = (rate, type) => {
    if (type === 'MILEAGE') {
      // Convert rate to miles per HKD
      const milesPerHKD = (1 / rate.rebate_rate).toFixed(1)
      return `${milesPerHKD} 里/HKD`
    } else if (type === 'POINTS') {
      const pointsPerHKD = (1 / rate.rebate_rate).toFixed(1)
      return `${pointsPerHKD} 分/HKD`
    } else {
      return `${(rate.rebate_rate * 100).toFixed(1)}%`
    }
  }

  // Get rebate type badge color
  const getBadgeStyle = (type) => {
    switch (type) {
      case 'MILEAGE':
        return { bg: '#DBEAFE', color: '#1E40AF', label: '✈️ 里數' }
      case 'POINTS':
        return { bg: '#FEF3C7', color: '#92400E', label: '🎁 積分' }
      default:
        return { bg: '#DCFCE7', color: '#166534', label: '💵 現金' }
    }
  }

  const displayRate = best_rate ? formatRate(best_rate, best_rate.rebate_type) : '-'
  const badge = best_rate ? getBadgeStyle(best_rate.rebate_type) : null

  return (
    <div className="card" style={{ marginBottom: '16px' }}>
      {/* Merchant Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
            {merchant_name}
          </h3>
          {badge && (
            <span 
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                background: badge.bg,
                color: badge.color
              }}
            >
              {badge.label}
            </span>
          )}
        </div>
        
        {/* Best Rate Display */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '4px' }}>
            最高回贈
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#0066FF' }}>
            {displayRate}
          </div>
        </div>
      </div>

      {/* Best Card Info */}
      {best_rate && (
        <div style={{ 
          marginTop: '16px', 
          padding: '12px 16px', 
          background: '#F0F9FF', 
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>最優惠信用卡</div>
            <div style={{ fontSize: '16px', fontWeight: '600' }}>
              {best_rate.bank_name} {best_rate.card_name}
            </div>
          </div>
          {best_rate.conditions && (
            <div style={{ 
              fontSize: '12px', 
              color: '#0066FF',
              background: 'white',
              padding: '4px 8px',
              borderRadius: '6px'
            }}>
              {best_rate.conditions}
            </div>
          )}
        </div>
      )}

      {/* Expand Button */}
      {all_rates.length > 1 && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            background: 'transparent',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#64748B',
            width: '100%',
            transition: 'all 0.2s'
          }}
        >
          {expanded ? '▲ 收起' : `▼ 查看全部 ${all_rates.length} 張信用卡`}
        </button>
      )}

      {/* All Rates List */}
      {expanded && all_rates.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#64748B' }}>
            所有信用卡回贈
          </div>
          {all_rates.map((rate, idx) => (
            <div 
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: idx === 0 ? '#F0FDF4' : '#F8FAFC',
                borderRadius: '8px',
                marginBottom: '8px',
                border: idx === 0 ? '1px solid #86EFAC' : '1px solid #E2E8F0'
              }}
            >
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>
                  {rate.bank_name} {rate.card_name}
                  {idx === 0 && <span style={{ marginLeft: '8px', color: '#16A34A', fontSize: '12px' }}>🔥 最優</span>}
                </div>
                {rate.conditions && (
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                    {rate.conditions}
                  </div>
                )}
              </div>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                color: idx === 0 ? '#16A34A' : '#0066FF' 
              }}>
                {formatRate(rate, rate.rebate_type)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
