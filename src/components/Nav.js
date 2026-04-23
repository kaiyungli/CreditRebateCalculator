/**
 * Product Navigation
 */
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Nav() {
  const router = useRouter()
  const current = router.pathname
  
  const links = [
    { href: '/offers', label: '優惠搜尋' },
    { href: '/calculate', label: '最佳回贈計算' },
    { href: '/merchants', label: '商戶' }
  ]
  
  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <div style={styles.logo}>
          <Link href="/" style={styles.logoLink}>CreditRebate</Link>
        </div>
        <div style={styles.links}>
          {links.map(l => (
            <Link 
              key={l.href} 
              href={l.href}
              style={{
                ...styles.link,
                ...(current === l.href ? styles.active : {})
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #e5e5e5',
    padding: '0 16px'
  },
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '50px'
  },
  logo: {
    fontWeight: 'bold',
    fontSize: '18px'
  },
  logoLink: {
    color: '#d00',
    textDecoration: 'none'
  },
  links: {
    display: 'flex',
    gap: '16px'
  },
  link: {
    color: '#666',
    textDecoration: 'none',
    fontSize: '14px',
    padding: '8px 12px',
    borderRadius: '4px'
  },
  active: {
    color: '#d00',
    fontWeight: 'bold',
    backgroundColor: '#fee'
  }
}
