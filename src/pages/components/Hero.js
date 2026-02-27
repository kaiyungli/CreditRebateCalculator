export default function Hero({ userCards = [] }) {
  return (
    <div className="hero container">
      <h1>找出最適合你的信用卡</h1>
      <p>輸入你想食嘢同買嘢的地方，幫你計算最佳回贈組合</p>
      {userCards.length > 0 && (
        <div style={{ 
          marginTop: '16px', 
          padding: '10px 20px', 
          background: 'rgba(255,255,255,0.25)', 
          borderRadius: '24px', 
          fontSize: '14px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backdropFilter: 'blur(8px)'
        }}>
          <span>🎴</span>
          <span>已選擇 <strong>{userCards.length}</strong> 張信用卡</span>
          <span style={{ opacity: 0.7 }}>| 會優先推薦你有的卡</span>
        </div>
      )}
    </div>
  );
}
