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

  // Move expense up
  function moveUp(index) {
    if (index === 0) return;
    const newExpenses = [...expenses];
    [newExpenses[index - 1], newExpenses[index]] = [newExpenses[index], newExpenses[index - 1]];
    if (typeof onUpdate === 'function') {
      onUpdate(newExpenses, true);
    }
  }

  // Move expense down
  function moveDown(index) {
    if (index === expenses.length - 1) return;
    const newExpenses = [...expenses];
    [newExpenses[index], newExpenses[index + 1]] = [newExpenses[index + 1], newExpenses[index]];
    if (typeof onUpdate === 'function') {
      onUpdate(newExpenses, true);
    }
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
                        padding: '2px 4px',
                        borderRadius: '4px',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'var(--border-color)'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      title="點擊修改金額"
                    >
                      HK${expense.amount.toLocaleString()} <span style={{ fontSize: '11px', opacity: 0.6, marginLeft: '4px' }}>✎ 點擊修改</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            {/* 操作按鈕：上移、下移、刪除 */}
            <div style={{ display: 'flex', gap: '2px' }}>
              <button
                onClick={() => moveUp(index)}
                disabled={index === 0}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: index === 0 ? '#ccc' : 'var(--text-secondary)',
                  cursor: index === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  padding: '4px 6px',
                }}
                title="上移"
              >
                ↑
              </button>
              <button
                onClick={() => moveDown(index)}
                disabled={index === expenses.length - 1}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: index === expenses.length - 1 ? '#ccc' : 'var(--text-secondary)',
                  cursor: index === expenses.length - 1 ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  padding: '4px 6px',
                }}
                title="下移"
              >
                ↓
              </button>
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
