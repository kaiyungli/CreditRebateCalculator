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
  setSelectedMerchant,
  userCards = [],
  onPreviewRebate
}) {
  // Calculate instant rebate preview
  const previewRebate = (() => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) return null;
    if (!selectedCategory) return null;
    if (userCards.length === 0) return null;
    
    const amountNum = parseFloat(amount);
    // Estimate 1-3% rebate as preview (average case)
    const estimatedRate = 0.02; // 2% average
    return amountNum * estimatedRate;
  })();

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
        
        {/* 即時回贈預覽 */}
        {previewRebate !== null && (
          <div style={{ 
            marginTop: '12px', 
            padding: '12px 16px', 
            background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.15) 0%, rgba(0, 102, 255, 0.15) 100%)',
            borderRadius: '10px',
            border: '1px solid var(--secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>💡</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                預計回贈
              </span>
            </div>
            <span style={{ 
              fontSize: '20px', 
              fontWeight: '700', 
              color: 'var(--secondary)',
              background: 'var(--card-bg)',
              padding: '4px 12px',
              borderRadius: '8px'
            }}>
              ≈ HK${previewRebate.toFixed(2)}
            </span>
          </div>
        )}
        
        {/* 提示：需要選擇信用卡 */}
        {amount && selectedCategory && userCards.length === 0 && (
          <div style={{ 
            marginTop: '8px', 
            fontSize: '12px', 
            color: 'var(--text-secondary)',
            textAlign: 'center'
          }}>
            💳 選擇信用卡可獲得更準確的回贈計算
          </div>
        )}
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
