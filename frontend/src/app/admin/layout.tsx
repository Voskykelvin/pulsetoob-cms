'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const contactEmail = user?.email || 'kelvinvosky2@gmail.com'

  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (!token) {
      router.push('/login')
      return
    }
    
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', fontFamily: 'sans-serif' }}>
        <div style={{ color: '#16a34a', fontWeight: '600', fontSize: '1.25rem' }}>
          Loading Admin Panel...
        </div>
      </div>
    )
  }

  const menuItems = [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Homepage', href: '/admin/homepage' },
    { label: 'Articles', href: '/admin/articles' },
    { label: 'Categories', href: '/admin/categories' },
    { label: 'Media', href: '/admin/media' },
    { label: 'Analytics', href: '/admin/analytics' },
    { label: 'Audience', href: '/admin/audience' },
    { label: 'Advertising', href: '/admin/ads' },
    { label: 'SEO Tools', href: '/admin/seo' },
    { label: 'RSS Feeds', href: '/admin/rss' },
    { label: 'Backlinks', href: '/admin/backlinks' },
    { label: 'MSN', href: '/admin/msn' },
    { label: 'Users', href: '/admin/users' },
    { label: 'Settings', href: '/admin/settings' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 2rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>PulseToob</span>
          <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', border: '1px solid #bbf7d0' }}>Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Welcome, {contactEmail}</span>
          <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '0.875rem', color: '#374151', outline: 'none' }}>
            Logout
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <aside style={{ width: '240px', background: 'white', borderRight: '1px solid #e5e7eb', minHeight: 'calc(100vh - 64px)', padding: '1.5rem 1rem', flexShrink: 0 }}>
          {menuItems.map((item) => {
            // Check if active: exact match, or parent of sub-page (e.g. /admin/articles/new matches /admin/articles)
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{ 
                  display: 'block', 
                  padding: '0.625rem 0.875rem', 
                  borderRadius: '8px', 
                  marginBottom: '0.25rem', 
                  textDecoration: 'none', 
                  color: isActive ? '#16a34a' : '#374151', 
                  background: isActive ? '#f0fdf4' : 'transparent', 
                  fontWeight: isActive ? '600' : '400', 
                  fontSize: '0.9rem', 
                  border: isActive ? '1px solid #bbf7d0' : '1px solid transparent' 
                }}
              >
                {item.label}
              </Link>
            )
          })}
        </aside>

        {/* Page Content area */}
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
