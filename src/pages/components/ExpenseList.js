import { useState } from 'react';

export default function ExpenseList({ expenses = [], onRemove, onUpdate, totalAmount = 0, categories = [] }) {
  const [editingExpense, setEditingExpense] = useState(null);
  const [editForm, setEditForm] = useState({ amount: '', categoryId: '', merchantName: '' });

  if (expenses.length === 0) return null;

  // Open edit modal
  function handleEditClick(expense) {
    setEditingExpense(expense);
    setEditForm({
      amount: expense.amount.toString(),
      categoryId: expense.categoryId,
      merchantName: expense.merchantName || ''
    });
  }

  // Save edit
  function handleSaveEdit() {
    const categoryInfo = categories.find(c => String(c.id) === String(editForm.categoryId));
    onUpdate({
      ...editingExpense,
      amount: parseFloat(editForm.amount) || 0,
      categoryId: editForm.categoryId,
      categoryName: categoryInfo?.name || editingExpense.categoryName,
      categoryIcon: categoryInfo?.icon || editingExpense.categoryIcon,
      merchantName: editForm.merchantName || null
    });
    setEditingExpense(null);
  }

  return (
    <>
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-secondary)' }}>
          已添加 ({expenses.length})
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {expenses.map((expense, index) => (
            <div 
              key={expense.id}
              onClick={() => handleEditClick(expense)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                background: 'var(--background)',
                borderRadius: '10px',
                cursor: 'pointer',
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
                    HK${expense.amount.toLocaleString()}
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(expense.id); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#FF6B6B',
                  cursor: 'pointer',
                  fontSize: '20px',
                  padding: '4px 8px',
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

      {/* Edit Modal */}
      {editingExpense && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setEditingExpense(null)}>
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '16px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px' }}>編輯消費</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}>金額 (HK$)</label>
              <input
                type="number"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                className="input-field"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}>類別</label>
              <select
                value={editForm.categoryId}
                onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                className="input-field"
                style={{ width: '100%', boxSizing: 'border-box' }}
              >
                <option value="">選擇類別</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}>商戶 (可選)</label>
              <input
                type="text"
                value={editForm.merchantName}
                onChange={(e) => setEditForm({ ...editForm, merchantName: e.target.value })}
                placeholder="商戶名稱"
                className="input-field"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setEditingExpense(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: '2px solid var(--border-color)',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'var(--primary)',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
