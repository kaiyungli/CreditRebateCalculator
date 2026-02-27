import MerchantSearch from './MerchantSearch';

export default function ExpenseInput({ 
  amount, 
  setAmount, 
  selectedCategory, 
  setSelectedCategory, 
  categories = [],
  categoriesLoading = false,
  onAdd,
  disabled = false,
  selectedMerchant,
  setSelectedMerchant
}) {
  return (
    <div className="card calculator-card">
      <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>
        🛒 添加消費
      </h2>

      {/* 商戶搜尋 */}
      <div style={{ marginBottom: '16px' }}>
        <MerchantSearch 
          categories={categories}
          onSelect={setSelectedCategory}
          selectedMerchant={selectedMerchant}
          setSelectedMerchant={setSelectedMerchant}
        />
      </div>

      {/* 或選擇類別 */}
      <p style={{ 
        textAlign: 'center', 
        fontSize: '14px', 
        color: 'var(--text-secondary)',
        marginBottom: '16px'
      }}>
        或者直接選擇類別：
      </p>

      {/* 商戶類別 */}
      <div style={{ marginBottom: '16px' }}>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="input-field"
          style={{ cursor: 'pointer' }}
          disabled={categoriesLoading}
        >
          <option value="">
            {categoriesLoading ? '載入中...' : '選擇類別'}
          </option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id.toString()}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>

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
          inputMode="numeric"
          pattern="[0-9]*"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="輸入金額，例如：500"
          className="input-field"
        />
      </div>

      {/* 新增按鈕 */}
      <button
        onClick={onAdd}
        disabled={disabled}
        className="btn-primary calculate-btn"
        style={{ marginTop: '16px' }}
      >
        ➕ 新增消費
      </button>
    </div>
  );
}
