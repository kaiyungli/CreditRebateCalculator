export default function Footer() {
  return (
    <footer style={{ 
      marginTop: '60px', 
      padding: '32px 20px', 
      textAlign: 'center',
      color: 'var(--text-secondary)',
      borderTop: '1px solid var(--border-color)'
    }}>
      <p>💳 CardCal - 香港信用卡回贈計算器</p>
      <p style={{ fontSize: '14px', marginTop: '8px' }}>
        數據僅供參考，請以銀行官方資料為準
      </p>
    </footer>
  );
}
