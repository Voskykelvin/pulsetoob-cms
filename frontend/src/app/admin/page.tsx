'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { getApiBaseUrl } from '@/utils/apiBase'

interface Stats {
  users: number
  articles: { total: number; published: number; drafts: number; scheduled: number }
  media: number
  categories: number
  views: { total: number }
  storage: { usedFormatted: string }
}

const statusDot = {
  width: '0.65rem',
  height: '0.65rem',
  borderRadius: '999px',
  background: '#16a34a',
  border: '1px solid #14532d',
  flexShrink: 0,
}

const statusItem = {
  color: '#374151',
  fontSize: '0.875rem',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const apiUrl = getApiBaseUrl().replace(/\/api$/, '')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pulsetoob.com'

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/overview')
      if (res.data.success) setStats(res.data.data)
    } catch (err) {
      console.error('Failed to fetch stats')
    } finally {
      setLoading(false)
    }
  }

  const cards = stats ? [
    { label: 'Total Articles', value: stats.articles.total, sub: `${stats.articles.published} published`, color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Published', value: stats.articles.published, sub: `${stats.articles.drafts} drafts`, color: '#2563eb', bg: '#eff6ff' },
    { label: 'Scheduled', value: stats.articles.scheduled, sub: 'pending publish', color: '#d97706', bg: '#fffbeb' },
    { label: 'Total Users', value: stats.users, sub: 'registered users', color: '#7c3aed', bg: '#f5f3ff' },
    { label: 'Media Files', value: stats.media, sub: stats.storage.usedFormatted + ' used', color: '#db2777', bg: '#fdf2f8' },
    { label: 'Categories', value: stats.categories, sub: 'active categories', color: '#0891b2', bg: '#ecfeff' },
    { label: 'Total Views', value: stats.views.total?.toLocaleString() || '0', sub: 'all time views', color: '#16a34a', bg: '#f0fdf4' },
  ] : []

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827' }}>Dashboard</h1>
        <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Here is what is happening with PulseToob.</p>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ background: '#f3f4f6', height: '120px', borderRadius: '12px', animation: 'pulse 2s infinite' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {cards.map((card) => (
            <div key={card.label} style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{card.label}</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: card.color }}>{card.value}</p>
              <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.25rem' }}>{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '2rem', background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>Quick Actions</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {[
            { label: '+ New Article', href: '/admin/articles/new', color: '#16a34a' },
            { label: '+ New Category', href: '/admin/categories', color: '#2563eb' },
            { label: 'Upload Media', href: '/admin/media', color: '#d97706' },
            { label: 'SEO Analysis', href: '/admin/seo', color: '#7c3aed' },
            { label: 'View Analytics', href: '/admin/analytics', color: '#0891b2' },
          ].map((action) => (
            <a
              key={action.label}
              href={action.href}
              style={{ padding: '0.625rem 1.25rem', background: action.color, color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '0.875rem', fontWeight: '500' }}
            >
              {action.label}
            </a>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', background: '#f0fdf4', borderRadius: '12px', padding: '1.25rem', border: '1px solid #bbf7d0' }}>
        <h3 style={{ color: '#16a34a', fontWeight: '600', marginBottom: '0.5rem' }}>System Status</h3>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <span style={statusItem}>
              <span style={statusDot} />
            Backend API: {apiUrl}
          </span>
          <span style={statusItem}>
            <span style={statusDot} />
            Database: PostgreSQL Connected
          </span>
          <span style={statusItem}>
            <span style={statusDot} />
            Frontend: {siteUrl}
          </span>
        </div>
      </div>
    </div>
  )
}
