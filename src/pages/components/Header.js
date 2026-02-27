export default function Header({ darkMode = false, setDarkMode = () => {}, userCards = [], onOpenCardSelector = () => {} }) {
  const buttonText = userCards?.length > 0 ? `已選 ${userCards.length} 張卡` : '選擇信用卡';
  
  return (
    <nav className="navbar container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '28px' }}>💳</span>
        <span style={{ fontSize: '24px', fontWeight: '800' }}>CardCal</span>
      </div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        {/* 合併「選擇信用卡」與「我的卡片」為一按鈕 */}
        <button
          onClick={onOpenCardSelector}
          className="btn-primary"
          style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            padding: '10px 20px'
          }}
        >
          <span>🎴</span>
          <span>{buttonText}</span>
        </button>
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{ fontSize: '24px', background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  );
}
