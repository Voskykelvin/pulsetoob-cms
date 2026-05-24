'use client'

import { useEffect, useState, type FormEvent } from 'react'
import type { AxiosError } from 'axios'
import api from '@/lib/api'
import type { AdSlotName, Advertisement, ApiResponse } from '@/types/cms'

interface ApiError {
  error?: string
  message?: string
}

interface AdForm {
  title: string
  sponsorName: string
  imageUrl: string
  targetUrl: string
  slot: AdSlotName
  isActive: boolean
  startDate: string
  endDate: string
}

const DEFAULT_FORM: AdForm = {
  title: '',
  sponsorName: '',
  imageUrl: '',
  targetUrl: '',
  slot: 'header_leaderboard',
  isActive: true,
  startDate: '',
  endDate: '',
}

const slots: Array<{ value: AdSlotName; label: string; size: string }> = [
  { value: 'header_leaderboard', label: 'Header Leaderboard', size: '728 x 90' },
  { value: 'sidebar_square', label: 'Sidebar Square', size: '300 x 250' },
  { value: 'in_article_banner', label: 'In-Article Banner', size: '468 x 60' },
]

export default function AdsPage() {
  const [ads, setAds] = useState<Advertisement[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Advertisement | null>(null)
  const [form, setForm] = useState<AdForm>(DEFAULT_FORM)

  useEffect(() => {
    fetchAds()
  }, [])

  const fetchAds = async () => {
    try {
      setLoading(true)
      const res = await api.get<ApiResponse<Advertisement[]>>('/admin/ads')
      if (res.data.success) setAds(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setForm(DEFAULT_FORM)
    setShowModal(true)
  }

  const openEdit = (ad: Advertisement) => {
    setEditing(ad)
    setForm({
      title: ad.title,
      sponsorName: ad.sponsorName || '',
      imageUrl: ad.imageUrl,
      targetUrl: ad.targetUrl,
      slot: ad.slot,
      isActive: ad.isActive,
      startDate: ad.startDate ? ad.startDate.slice(0, 10) : '',
      endDate: ad.endDate ? ad.endDate.slice(0, 10) : '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const payload = {
      ...form,
      sponsorName: form.sponsorName || null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
    }

    try {
      setSaving(true)
      if (editing) await api.put(`/admin/ads/${editing.id}`, payload)
      else await api.post('/admin/ads', payload)
      setShowModal(false)
      fetchAds()
    } catch (err) {
      const error = err as AxiosError<ApiError>
      alert(error.response?.data?.error || error.response?.data?.message || 'Failed to save advertisement')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (ad: Advertisement) => {
    try {
      await api.put(`/admin/ads/${ad.id}`, { isActive: !ad.isActive })
      fetchAds()
    } catch (err) {
      alert('Failed to update advertisement')
    }
  }

  const handleDelete = async (ad: Advertisement) => {
    if (!confirm(`Delete "${ad.title}"?`)) return
    try {
      await api.delete(`/admin/ads/${ad.id}`)
      fetchAds()
    } catch (err) {
      alert('Failed to delete advertisement')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>Advertising</h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>Manage direct sponsorships and slot performance.</p>
        </div>
        <button onClick={openCreate} style={{ padding: '0.5rem 1.25rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
          + New Ad
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['Campaign', 'Slot', 'Performance', 'Status', 'Actions'].map((heading) => (
                <th key={heading} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>Loading ads...</td></tr>
            ) : ads.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>No direct ads yet. Create one to fill sponsorship slots.</td></tr>
            ) : ads.map((ad) => {
              const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0.00'
              const slot = slots.find((item) => item.value === ad.slot)

              return (
                <tr key={ad.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600, color: '#111827' }}>{ad.title}</div>
                    <div style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.2rem' }}>{ad.sponsorName || 'Direct sponsor'}</div>
                  </td>
                  <td style={{ padding: '1rem', color: '#374151', fontSize: '0.875rem' }}>
                    <div>{slot?.label || ad.slot}</div>
                    <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{slot?.size}</div>
                  </td>
                  <td style={{ padding: '1rem', color: '#374151', fontSize: '0.875rem' }}>
                    <div>{ad.impressions.toLocaleString()} impressions</div>
                    <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>{ad.clicks.toLocaleString()} clicks, {ctr}% CTR</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', background: ad.isActive ? '#f0fdf4' : '#f9fafb', color: ad.isActive ? '#16a34a' : '#6b7280', border: `1px solid ${ad.isActive ? '#bbf7d0' : '#e5e7eb'}` }}>
                      {ad.isActive ? 'Active' : 'Paused'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button onClick={() => openEdit(ad)} style={smallButton}>Edit</button>
                      <button onClick={() => handleToggle(ad)} style={smallButton}>{ad.isActive ? 'Pause' : 'Activate'}</button>
                      <button onClick={() => handleDelete(ad)} style={{ ...smallButton, color: '#dc2626', borderColor: '#fecaca', background: '#fef2f2' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '640px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>{editing ? 'Edit Ad' : 'New Direct Ad'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}>x</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
                <label style={labelStyle}>Campaign title<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={fieldStyle} /></label>
                <label style={labelStyle}>Sponsor name<input value={form.sponsorName} onChange={(e) => setForm({ ...form, sponsorName: e.target.value })} style={fieldStyle} /></label>
                <label style={labelStyle}>Image URL<input required value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} style={fieldStyle} placeholder="https://..." /></label>
                <label style={labelStyle}>Target URL<input required value={form.targetUrl} onChange={(e) => setForm({ ...form, targetUrl: e.target.value })} style={fieldStyle} placeholder="https://..." /></label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <label style={labelStyle}>Slot<select value={form.slot} onChange={(e) => setForm({ ...form, slot: e.target.value as AdSlotName })} style={fieldStyle}>{slots.map((slot) => <option key={slot.value} value={slot.value}>{slot.label}</option>)}</select></label>
                <label style={labelStyle}>Start date<input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} style={fieldStyle} /></label>
                <label style={labelStyle}>End date<input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} style={fieldStyle} /></label>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#374151', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Active campaign
              </label>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.625rem 1rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '0.625rem 1rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving...' : 'Save Ad'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const fieldStyle = {
  width: '100%',
  padding: '0.625rem',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  fontSize: '0.875rem',
  boxSizing: 'border-box' as const,
  outline: 'none',
}

const labelStyle = {
  display: 'grid',
  gap: '0.4rem',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: '#374151',
}

const smallButton = {
  padding: '0.375rem 0.75rem',
  background: '#f9fafb',
  color: '#374151',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.8rem',
}
