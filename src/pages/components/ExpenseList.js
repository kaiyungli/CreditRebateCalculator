export default function ExpenseList({ expenses = [], onRemove, totalAmount = 0 }) {
  if (expenses.length === 0) return null;

  return (
    <div style={{ marginBottom: '24px' }}>
      <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-secondary)' }}>
        已添加 ({expenses.length})
      </h4>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {expenses.map((expense, index) => (
          <div 
            key={expense.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: 'var(--background)',
              borderRadius: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ 
                width: '32px', 
                height: '32px', 
                background: 'var(--primary)', 
                color: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
              }}>
                {index + 1}
              </span>
              <div>
                <div style={{ fontWeight: '600' }}>
                  {expense.categoryIcon} {expense.categoryName}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  HK${expense.amount.toLocaleString()}
                </div>
              </div>
            </div>
            <button
              onClick={() => onRemove(expense.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#FF6B6B',
                cursor: 'pointer',
                fontSize: '20px',
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* 總金額 */}
      <div style={{ 
        marginTop: '16px', 
        padding: '16px', 
        background: 'linear-gradient(135deg, #0066FF 0%, #00D4AA 100%)',
        borderRadius: '12px',
        color: 'white',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>總消費金額</div>
        <div style={{ fontSize: '28px', fontWeight: '800' }}>
          HK${totalAmount.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
