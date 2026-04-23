import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

const SCENARIOS = [
  { emoji: '🍣', name: '餐廳', amount: 500, category: '1', desc: 'Dining' },
  { emoji: '🛒', name: '超市', amount: 500, category: '4', desc: 'Supermarket' },
  { emoji: '🛍', name: '網購', amount: 1000, category: '2', desc: 'Shopping' },
  { emoji: '✈️', name: '旅遊', amount: 3000, category: '3', desc: 'Travel' }
]

export default function Home() {
  const router = useRouter()
  
  const handleScenario = (scenario) => {
    router.push(`/calculate?amount=${scenario.amount}&category_id=${scenario.category}`)
  }

  return (
    <div style={styles.container}>
      <Head><title>CreditRebate - 信用卡優惠比較</title></Head>
      
      {/* Hero */}
      <div style={styles.hero}>
        <h1 style={styles.title}>信用卡優惠比較</h1>
        <p style={styles.subtitle}>即刻搵出最抵回贈</p>
      </div>
      
      {/* Scenarios */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>熱門消費情境</h2>
        <div style={styles.scenarioGrid}>
          {SCENARIOS.map((s, i) => (
            <div key={i} style={styles.scenarioCard} onClick={() => handleScenario(s)}>
              <div style={styles.emoji}>{s.emoji}</div>
              <div style={styles.scenarioName}>{s.name}</div>
              <div style={styles.scenarioAmount}>${s.amount}</div>
              <div style={styles.scenarioDesc}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Offers link */}
      <div style={styles.linkSection}>
        <Link href="/offers" style={styles.linkButton}>
          查看所有優惠 →
        </Link>
      </div>
      
      {/* Footer */}
      <div style={styles.footer}>
        <p>CreditRebate © 2024</p>
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', textAlign: 'center' },
  hero: { padding: '40px 0 30px', backgroundColor: '#d00', color: '#fff', borderRadius: '12px', marginBottom: '24px' },
  title: { fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0' },
  subtitle: { fontSize: '16px', margin: 0, opacity: 0.9 },
  section: { marginBottom: '24px' },
  sectionTitle: { fontSize: '18px', fontWeight: 'bold', margin: '0 0 16px 0', textAlign: 'left' },
  scenarioGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' },
  scenarioCard: { padding: '20px 12px', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '10px', cursor: 'pointer', transition: 'transform 0.1s' },
  emoji: { fontSize: '32px', marginBottom: '8px' },
  scenarioName: { fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' },
  scenarioAmount: { fontSize: '22px', fontWeight: 'bold', color: '#d00', marginBottom: '4px' },
  scenarioDesc: { fontSize: '12px', color: '#999' },
  linkSection: { marginBottom: '24px' },
  linkButton: { display: 'inline-block', padding: '12px 24px', backgroundColor: '#f5f5f5', color: '#333', textDecoration: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold' },
  footer: { padding: '20px 0', color: '#999', fontSize: '13px' }
}
