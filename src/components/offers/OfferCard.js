export default function OfferCard({ offer, formatOffer }) {
  const rewardText = formatOffer ? formatOffer(offer) : offer.title
  
  const banks = { 1: 'HSBC', 2: 'Hang Seng', 3: 'BOC', 4: 'SC' }
  const cats = { 1: '餐飲', 2: '購物', 3: '旅遊', 4: '超市' }

  return (
    <div style={styles.card}>
      {/* Reward highlight */}
      <div style={styles.reward}>{rewardText}</div>
      
      {/* Title */}
      <h3 style={styles.title}>{offer.title}</h3>
      
      {/* Meta */}
      <div style={styles.meta}>
        {offer.bank_id && <span>{banks[offer.bank_id]}</span>}
        {offer.bank_id && offer.category_id && <span> · </span>}
        {offer.category_id && <span>{cats[offer.category_id]}</span>}
      </div>
      
      {/* Source */}
      {offer.source_name && <div style={styles.source}>來源: {offer.source_name}</div>}
      
      {/* Button */}
      {offer.source_url && (
        <a href={offer.source_url} target="_blank" rel="noopener" style={styles.button}>
          查看優惠 →
        </a>
      )}
    </div>
  )
}

const styles = {
  card: { border: '1px solid #eee', borderRadius: '8px', padding: '14px', marginBottom: '10px', backgroundColor: '#fff' },
  reward: { fontSize: '18px', fontWeight: 'bold', color: '#d00', marginBottom: '6px' },
  title: { fontSize: '15px', fontWeight: '600', margin: '0 0 4px 0' },
  meta: { fontSize: '13px', color: '#666', marginBottom: '6px' },
  source: { fontSize: '12px', color: '#999', marginBottom: '8px' },
  button: { display: 'inline-block', padding: '6px 12px', backgroundColor: '#d00', color: '#fff', borderRadius: '4px', textDecoration: 'none', fontSize: '13px' }
}
