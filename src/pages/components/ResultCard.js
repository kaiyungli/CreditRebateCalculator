export default function ResultCard({ results = [], totalAmount = 0, totalRebate = 0, breakdown = {}, onReset = () => {} }) {
  if (results.length === 0) return null;

  // Format reward kind display
  const formatRewardKind = (kind) => {
    switch (kind) {
      case 'CASHBACK': return '回贈';
      case 'MILES': return '里數';
      case 'POINTS': return '積分';
      default: return '回贈';
    }
  };

  // Format rate display
  const formatRate = (ruleDetails) => {
    if (!ruleDetails) return '';
    const { rateUnit, rateValue, rewardKind } = ruleDetails;
    
    if (rateUnit === 'PERCENT') {
      return `${(rateValue * 100).toFixed(1)}%`;
    }
    if (rateUnit === 'PER_AMOUNT') {
      if (rewardKind === 'MILES') {
        return `${rateValue} 里/HKD`;
      }
      return `${rateValue} 分/HKD`;
    }
    return '';
  };

  return (
    <div style={{ marginTop: '40px' }}>
      <h3 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>
        🎯 最佳信用卡組合
      </h3>

      {/* 總回贈 */}
      <div style={{ 
        marginBottom: '32px',
        padding: '32px', 
        background: 'linear-gradient(135deg, #00D4AA 0%, #0066FF 100%)',
        borderRadius: '20px',
        color: 'white',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '18px', opacity: 0.9, marginBottom: '8px' }}>
          💰 總回贈
        </div>
        <div style={{ fontSize: '48px', fontWeight: '800' }}>
          HK${totalRebate.toFixed(2)}
        </div>
        <div style={{ fontSize: '16px', opacity: 0.9, marginTop: '8px' }}>
          實際回贈率: {totalAmount > 0 ? ((totalRebate / totalAmount) * 100).toFixed(2) : 0}%
        </div>
        
        {/* Breakdown */}
        {(breakdown.cashback > 0 || breakdown.miles > 0 || breakdown.points > 0) && (
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            background: 'rgba(255,255,255,0.15)', 
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            fontSize: '14px'
          }}>
            {breakdown.cashback > 0 && (
              <div>
                <div>💵 現金回贈</div>
                <div style={{ fontWeight: '700' }}>HK${breakdown.cashback.toFixed(2)}</div>
              </div>
            )}
            {breakdown.miles > 0 && (
              <div>
                <div>✈️ 里數</div>
                <div style={{ fontWeight: '700' }}>{breakdown.miles.toLocaleString()} 里</div>
              </div>
            )}
            {breakdown.points > 0 && (
              <div>
                <div>🎯 積分</div>
                <div style={{ fontWeight: '700' }}>{breakdown.points.toLocaleString()} 分</div>
              </div>
            )}
          </div>
        )}

      {/* 每筆消費的最佳卡 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {results.map((result, index) => (
          <div 
            key={result.id}
            className="card result-card"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ 
                width: '40px', 
                height: '40px', 
                background: 'var(--primary)', 
                color: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: '700',
              }}>
                {index + 1}
              </span>
              <div>
                <div style={{ fontWeight: '700', fontSize: '18px' }}>
                  {result.categoryIcon} {result.categoryName}
                  {result.merchantName && (
                    <span style={{ fontWeight: '400', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                      - {result.merchantName}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>
                  HK${result.amount.toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{
              padding: '16px',
              background: 'var(--background)',
              borderRadius: '12px',
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: result.capInfo ? '12px' : '0'
              }}>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    建議使用
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '18px', color: 'var(--primary)' }}>
                    {result.bestCard?.icon || '💳'} {result.bestCard?.bankName} {result.bestCard?.name}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {result.ruleDetails && (
                      <>
                        {formatRewardKind(result.ruleDetails.rewardKind)} · {formatRate(result.ruleDetails)}
                        {result.ruleDetails.rewardKind === 'MILES' && ' (每里 HKD 0.05)'}
                        {result.ruleDetails.rewardKind === 'POINTS' && ' (每分 HKD 0.01)'}
                      </>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    可獲回贈
                  </div>
                  <div style={{ fontWeight: '800', fontSize: '24px', color: '#00D4AA' }}>
                    HK${result.rebate.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Cap Info Display */}
              {result.capInfo && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: result.capInfo.remainingAfter > 0 ? '#FFF7ED' : '#FEF2F2',
                  borderRadius: '8px',
                  border: `1px solid ${result.capInfo.remainingAfter > 0 ? '#FCD34D' : '#FECACA'}`
                }}>
                  <div style={{ 
                    fontSize: '13px', 
                    fontWeight: '600',
                    color: result.capInfo.remainingAfter > 0 ? '#B45309' : '#DC2626',
                    marginBottom: '4px'
                  }}>
                    ⚠️ 已達上限
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    限額: HK${result.capInfo.cap} | 已用: HK${result.capInfo.usedAfter} | 剩餘: HK${result.capInfo.remainingAfter}
                  </div>
                  {result.capNote && (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {result.capNote}
                    </div>
                  )}
                </div>
              )}

              {/* Cap Period Display */}
              {result.ruleDetails?.capValue && !result.capInfo && (
                <div style={{
                  marginTop: '12px',
                  padding: '8px 12px',
                  background: 'var(--card-bg)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)'
                }}>
                  📅 每月上限: HK${result.ruleDetails.capValue}
                  {result.ruleDetails.capPeriod === 'MONTHLY' && ' (每月)'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 按鈕 */}
      <div style={{ marginTop: '24px', textAlign: 'center', display: 'flex', gap: '16px', justifyContent: 'center' }}>
        <button
          onClick={onReset}
          className="btn-secondary"
        >
          🔄 重新計算
        </button>
        <a href="/cards" className="btn-primary">
          查看所有信用卡 →
        </a>
      </div>
    </div>
  );
};
