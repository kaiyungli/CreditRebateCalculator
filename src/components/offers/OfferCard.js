/**
 * Offer Card Component
 */

export default function OfferCard({ offer, onView }) {
  // Format reward display
  let rewardText = ''
  if (offer.value && offer.value_type) {
    if (offer.value_type === 'PERCENT') {
      rewardText = `${offer.value}% cashback`
    } else if (offer.value_type === 'FIXED') {
      rewardText = `HK$${offer.value} 優惠券`
    }
  }
  if (offer.min_spend) {
    rewardText += `（滿 HK$${offer.min_spend}）`
  }
  if (!rewardText) {
    rewardText = offer.offer_type || '優惠'
  }

  // Bank mapping
  const banks = { 1: 'HSBC', 2: 'Hang Seng', 3: 'BOC', 4: 'SC', 5: 'Citi' }
  const categories = { 1: '餐飲', 2: '購物', 3: '旅遊', 4: '超市' }

  return (
    <div className="offer-card" style={styles.card}>
      {/* Reward highlight */}
      <div style={styles.reward}>{rewardText}</div>
      
      {/* Title */}
      <h3 style={styles.title}>{offer.title}</h3>
      
      {/* Description */}
      {offer.description && (
        <p style={styles.desc}>{offer.description.slice(0, 80)}...</p>
      )}
      
      {/* Meta info */}
      <div style={styles.meta}>
        {offer.merchant_id && <span>商戶ID: {offer.merchant_id}</span>}
        {offer.bank_id && <span> | {banks[offer.bank_id] || '銀行'}</span>}
        {offer.category_id && <span> | {categories[offer.category_id]}</span>}
      </div>
      
      {/* Source */}
      {offer.source_name && (
        <div style={styles.source}>來源: {offer.source_name}</div>
      )}
      
      {/* Action button */}
      {offer.source_url && (
        <a href={offer.source_url} target="_blank" rel="noopener" style={styles.button}>
          查看優惠 →
        </a>
      )}
    </div>
  )
}

const styles = {
  card: {
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px',
    backgroundColor: '#fff'
  },
  reward: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#d00',
    marginBottom: '8px'
  },
  title: {
    fontSize: '16px',
    fontWeight: 'bold',
    margin: '0 0 8px 0'
  },
  desc: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 8px 0'
  },
  meta: {
    fontSize: '12px',
    color: '#999',
    margin: '0 0 4px 0'
  },
  source: {
    fontSize: '12px',
    color: '#999',
    margin: '0 0 12px 0'
  },
  button: {
    display: 'inline-block',
    padding: '8px 16px',
    backgroundColor: '#d00',
    color: '#fff',
    borderRadius: '4px',
    textDecoration: 'none',
    fontSize: '14px'
  }
}
