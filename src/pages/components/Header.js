export default function Header({ darkMode = false, setDarkMode = () => {}, userCards = [], onOpenCardSelector = () => {} }) {
  return (
    <nav className="navbar container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '28px' }}>💳</span>
        <span style={{ fontSize: '24px', fontWeight: '800' }}>CardCal</span>
      </div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <button
          onClick={onOpenCardSelector}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            cursor: 'pointer',
            fontSize: '14px',
            color: 'var(--text-secondary)'
          }}
        >
          🎴 我的卡片 ({userCards?.length || 0})
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
