'use client'
import { useState, useEffect } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import type { AxiosError } from 'axios'
import type { ApiResponse, Category } from '@/types/cms'

interface CategoryForm {
  name: string
  description: string
  color: string
  icon: string
  showInNav: boolean
  rssEnabled: boolean
  msnEnabled: boolean
  isFeatured: boolean
}

interface ApiError {
  error?: string
  message?: string
}

const DEFAULT_FORM: CategoryForm = {
  name: '',
  description: '',
  color: '#22c55e',
  icon: '',
  showInNav: true,
  rssEnabled: true,
  msnEnabled: false,
  isFeatured: false,
}

export default function CategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState<CategoryForm>(DEFAULT_FORM)

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return }
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const res = await api.get<ApiResponse<Category[]>>('/categories?flat=true')
      if (res.data.success) setCategories(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      if (editing) { await api.put('/categories/' + editing.id, form); alert('Updated!') }
      else { await api.post('/categories', form); alert('Created!') }
      setShowModal(false); setEditing(null); setForm(DEFAULT_FORM); fetchCategories()
    } catch (err) {
      const error = err as AxiosError<ApiError>
      alert(error.response?.data?.error || error.response?.data?.message || 'Failed')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return
    try { await api.delete('/categories/' + id); fetchCategories() } catch (err) { alert('Delete failed') }
  }

  const openEdit = (cat: Category) => {
    setEditing(cat); setForm({ name: cat.name, description: cat.description || '', color: cat.color || '#22c55e', icon: cat.icon || '', showInNav: cat.showInNav ?? true, rssEnabled: cat.rssEnabled ?? true, msnEnabled: cat.msnEnabled ?? false, isFeatured: cat.isFeatured ?? false }); setShowModal(true)
  }

  const inputStyle: CSSProperties = { width: '100%', padding: '0.625rem', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', boxSizing: 'border-box', outline: 'none' }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'sans-serif' }}>
      <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 2rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <a href="/admin" style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.25rem' }}>PulseToob</a>
          <span style={{ color: '#9ca3af' }}>/</span>
          <span style={{ fontWeight: '600' }}>Categories</span>
        </div>
        <button onClick={() => { setEditing(null); setForm(DEFAULT_FORM); setShowModal(true) }} style={{ padding: '0.5rem 1.25rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>+ New Category</button>
      </header>

      <div style={{ padding: '2rem' }}>
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
          ) : categories.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>No categories yet. Click + New Category to create one!</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Category</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Articles</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>RSS</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: cat.color || '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: 'white' }}>{cat.icon || '?'}</div>
                        <div>
                          <div style={{ fontWeight: '500', color: '#111827' }}>{cat.name}</div>
                          <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>/{cat.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: '#6b7280' }}>{cat.articleCount || 0}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', background: cat.rssEnabled ? '#f0fdf4' : '#f9fafb', color: cat.rssEnabled ? '#16a34a' : '#9ca3af', border: '1px solid ' + (cat.rssEnabled ? '#bbf7d0' : '#e5e7eb') }}>{cat.rssEnabled ? 'Enabled' : 'Disabled'}</span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => openEdit(cat)} style={{ padding: '0.375rem 0.75rem', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Edit</button>
                        <button onClick={() => handleDelete(cat.id)} style={{ padding: '0.375rem 0.75rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{editing ? 'Edit' : 'New'} Category</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}>x</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={inputStyle} placeholder="e.g. Technology" />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Brief description..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Icon</label>
                  <input type="text" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} style={{ ...inputStyle, textAlign: 'center', fontSize: '1.5rem' }} placeholder="?" maxLength={4} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Color</label>
                  <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ width: '100%', height: '38px', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={form.showInNav} onChange={(e) => setForm({ ...form, showInNav: e.target.checked })} /> Show in Nav
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={form.rssEnabled} onChange={(e) => setForm({ ...form, rssEnabled: e.target.checked })} /> RSS Feed
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={form.msnEnabled} onChange={(e) => setForm({ ...form, msnEnabled: e.target.checked })} /> MSN Feed
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /> Featured
                </label>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.625rem 1.25rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.625rem 1.25rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
