export default function Header({ darkMode = false, setDarkMode = () => {}, userCards = [], onOpenCardSelector = () => {} }) {
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
          <span>我的卡片</span>
          {userCards?.length > 0 && (
            <span style={{ 
              background: 'rgba(255,255,255,0.3)', 
              padding: '2px 8px', 
              borderRadius: '12px',
              fontSize: '12px'
            }}>
              {userCards.length}
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
