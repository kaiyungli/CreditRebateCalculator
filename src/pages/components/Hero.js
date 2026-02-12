export default function Hero({ userCards }) {
  return (
    <div className="hero container">
      <h1>找出最適合你的信用卡</h1>
      <p>輸入你想食嘢同買嘢的地方，幫你計算最佳回贈組合</p>
      {userCards?.length > 0 && (
        <div style={{ marginTop: '16px', padding: '8px 16px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', fontSize: '14px' }}>
          🎴 已選擇 {userCards.length} 張信用卡 | 會優先推薦你有的卡
        </div>
      )}
    </div>
  );
}
