import { useState, useRef, useEffect } from 'react';

export default function ExpenseList({ expenses = [], onRemove, onUpdate, totalAmount = 0, categories = [] }) {
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const inputRef = useRef(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (editingExpenseId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingExpenseId]);

  if (expenses.length === 0) return null;

  // Start inline edit for amount
  function handleAmountClick(e, expense) {
    e.stopPropagation();
    setEditingExpenseId(expense.id);
    setEditAmount(expense.amount.toString());
  }

  // Save amount on Enter key
  function handleAmountKeyDown(e, expense) {
    if (e.key === 'Enter') {
      saveAmount(expense);
    } else if (e.key === 'Escape') {
      setEditingExpenseId(null);
    }
  }

  // Save amount on blur (click away)
  function handleAmountBlur(e, expense) {
    saveAmount(expense);
  }

  // Save the amount
  function saveAmount(expense) {
    const newAmount = parseFloat(editAmount) || 0;
    if (newAmount !== expense.amount) {
      onUpdate({
        ...expense,
        amount: newAmount
      });
    }
    setEditingExpenseId(null);
  }

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
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border-color)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--background)'}
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
                  {expense.merchantName && (
                    <span style={{ fontWeight: '400', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                      - {expense.merchantName}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {editingExpenseId === expense.id ? (
                    <input
                      ref={inputRef}
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      onKeyDown={(e) => handleAmountKeyDown(e, expense)}
                      onBlur={(e) => handleAmountBlur(e, expense)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: '120px',
                        padding: '4px 8px',
                        fontSize: '14px',
                        border: '2px solid var(--primary)',
                        borderRadius: '6px',
                        background: 'var(--card-bg)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                      }}
                    />
                  ) : (
                    <span 
                      onClick={(e) => handleAmountClick(e, expense)}
                      style={{ 
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px dashed transparent',
                        transition: 'all 0.2s',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(0, 102, 255, 0.1)';
                        e.target.style.borderColor = 'var(--primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'transparent';
                        e.target.style.borderColor = 'transparent';
                      }}
                      title="點擊修改金額"
                    >
                      <span style={{ 
                        fontSize: '14px', 
                        fontWeight: '600',
                        color: 'var(--primary)'
                      }}>HK${expense.amount.toLocaleString()}</span>
                      <span style={{ fontSize: '11px', opacity: 0.7, background: 'var(--border-color)', padding: '2px 6px', borderRadius: '4px' }}>✎ 編輯</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            {/* 刪除按鈕 */}
            <div style={{ display: 'flex', gap: '2px' }}>
              <button
                onClick={() => onRemove(expense.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#FF6B6B',
                  cursor: 'pointer',
                  fontSize: '20px',
                  padding: '4px 6px',
                }}
                title="刪除"
              >
                ✕
              </button>
            </div>
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
