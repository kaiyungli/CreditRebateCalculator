export default function ExpenseInput({ 
  amount, 
  setAmount, 
  selectedCategory, 
  setSelectedCategory, 
  categories,
  onAdd,
  disabled 
}) {
  return (
    <div className="card calculator-card">
      <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>
        🛒 添加消費
      </h2>

      {/* 消費金額 */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px', 
          fontWeight: '600',
          color: 'var(--text-secondary)'
        }}>
          消費金額 (HKD)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="輸入金額，例如：500"
          className="input-field"
        />
      </div>

      {/* 商戶類別 */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px', 
          fontWeight: '600',
          color: 'var(--text-secondary)'
        }}>
          商戶類別
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="input-field"
          style={{ cursor: 'pointer' }}
        >
          <option value="">選擇類別</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* 新增按鈕 */}
      <button
        onClick={onAdd}
        disabled={disabled}
        className="btn-primary calculate-btn"
        style={{ marginBottom: '24px' }}
      >
        ➕ 新增消費
      </button>
    </div>
  );
}
