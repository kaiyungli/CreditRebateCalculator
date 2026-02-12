export default function ResultCard({ results, totalAmount, totalRebate, onReset }) {
  if (results.length === 0) return null;

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
          實際回贈率: {((totalRebate / totalAmount) * 100).toFixed(2)}%
        </div>
      </div>

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
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  建議使用
                </div>
                <div style={{ fontWeight: '700', fontSize: '18px', color: 'var(--primary)' }}>
                  {result.bestCard.icon} {result.bestCard.bank_name} {result.bestCard.card_name}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  回贈率: {(result.bestCard.base_rate * 100).toFixed(1)}%
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
}
