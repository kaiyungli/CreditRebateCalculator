export default function Header({ darkMode = false, setDarkMode = () => {}, userCards = [], onOpenCardSelector = () => {} }) {
  const cardCount = userCards?.length || 0;
  const buttonText = cardCount > 0 ? `已選 ${cardCount} 張` : '選擇信用卡';
  
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
            padding: '10px 20px',
            position: 'relative'
          }}
        >
          <span>🎴</span>
          <span>{buttonText}</span>
          {cardCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              background: 'var(--secondary)',
              color: 'white',
              fontSize: '12px',
              fontWeight: '700',
              padding: '4px 8px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 212, 170, 0.4)',
              minWidth: '20px',
              textAlign: 'center'
            }}>
              {cardCount}
            </span>
          )}
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
