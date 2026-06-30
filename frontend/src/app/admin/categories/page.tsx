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
  parentId: string
  order: number
  isActive: boolean
  showInNav: boolean
  showInFooter: boolean
  showInSidebar: boolean
  rssEnabled: boolean
  msnEnabled: boolean
  isFeatured: boolean
  layout: 'grid' | 'list' | 'magazine' | 'masonry'
  postsPerPage: number
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
  parentId: '',
  order: 0,
  isActive: true,
  showInNav: true,
  showInFooter: false,
  showInSidebar: false,
  rssEnabled: true,
  msnEnabled: false,
  isFeatured: false,
  layout: 'grid',
  postsPerPage: 12,
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
    const payload = {
      ...form,
      parentId: form.parentId || null,
      order: Number(form.order) || 0,
      postsPerPage: Number(form.postsPerPage) || 12,
    }
    try {
      if (editing) { await api.put('/categories/' + editing.id, payload); alert('Updated!') }
      else { await api.post('/categories', payload); alert('Created!') }
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
    setEditing(cat); setForm({ name: cat.name, description: cat.description || '', color: cat.color || '#22c55e', icon: cat.icon || '', parentId: cat.parentId || '', order: cat.order ?? 0, isActive: cat.isActive ?? true, showInNav: cat.showInNav ?? true, showInFooter: cat.showInFooter ?? false, showInSidebar: cat.showInSidebar ?? false, rssEnabled: cat.rssEnabled ?? true, msnEnabled: cat.msnEnabled ?? false, isFeatured: cat.isFeatured ?? false, layout: cat.layout || 'grid', postsPerPage: cat.postsPerPage || 12 }); setShowModal(true)
  }

  const moveCategory = async (id: string, direction: -1 | 1) => {
    const currentIndex = categories.findIndex((cat) => cat.id === id)
    const targetIndex = currentIndex + direction
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= categories.length) return

    const nextCategories = [...categories]
    const [moved] = nextCategories.splice(currentIndex, 1)
    nextCategories.splice(targetIndex, 0, moved)
    setCategories(nextCategories)

    try {
      await api.post('/categories/reorder', { orderedIds: nextCategories.map((cat) => cat.id) })
      fetchCategories()
    } catch (err) {
      setCategories(categories)
      alert('Failed to reorder categories')
    }
  }

  const getParentName = (cat: Category) => {
    if (!cat.parentId) return null
    return categories.find((item) => item.id === cat.parentId)?.name || 'Parent category'
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
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Placement</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Articles</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>RSS</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat, index) => (
                  <tr key={cat.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: cat.color || '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: 'white' }}>{cat.icon || '?'}</div>
                        <div>
                          <div style={{ fontWeight: '500', color: '#111827' }}>{cat.name}</div>
                          <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>/{cat.slug}{getParentName(cat) ? ' under ' + getParentName(cat) : ''}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.8rem' }}>
                      <div>Order {cat.order ?? index}</div>
                      <div>{cat.layout || 'grid'} / {cat.postsPerPage || 12} posts</div>
                      <div style={{ marginTop: '0.25rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {cat.isActive === false && <span style={{ padding: '0.15rem 0.45rem', borderRadius: '999px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: '0.7rem' }}>Inactive</span>}
                        {cat.showInNav && <span style={{ padding: '0.15rem 0.45rem', borderRadius: '999px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontSize: '0.7rem' }}>Nav</span>}
                        {cat.showInSidebar && <span style={{ padding: '0.15rem 0.45rem', borderRadius: '999px', background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', fontSize: '0.7rem' }}>Sidebar</span>}
                        {cat.showInFooter && <span style={{ padding: '0.15rem 0.45rem', borderRadius: '999px', background: '#ecfdf5', color: '#059669', border: '1px solid #bbf7d0', fontSize: '0.7rem' }}>Footer</span>}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: '#6b7280' }}>{cat.articleCount || 0}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', background: cat.rssEnabled ? '#f0fdf4' : '#f9fafb', color: cat.rssEnabled ? '#16a34a' : '#9ca3af', border: '1px solid ' + (cat.rssEnabled ? '#bbf7d0' : '#e5e7eb') }}>{cat.rssEnabled ? 'Enabled' : 'Disabled'}</span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => moveCategory(cat.id, -1)} disabled={index === 0} style={{ padding: '0.375rem 0.6rem', background: index === 0 ? '#f9fafb' : '#f8fafc', color: index === 0 ? '#cbd5e1' : '#475569', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: index === 0 ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}>Up</button>
                        <button onClick={() => moveCategory(cat.id, 1)} disabled={index === categories.length - 1} style={{ padding: '0.375rem 0.6rem', background: index === categories.length - 1 ? '#f9fafb' : '#f8fafc', color: index === categories.length - 1 ? '#cbd5e1' : '#475569', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: index === categories.length - 1 ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}>Down</button>
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
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
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
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Parent Category</label>
                <select value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })} style={inputStyle}>
                  <option value="">None</option>
                  {categories.filter((cat) => cat.id !== editing?.id).map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Order</label>
                  <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Layout</label>
                  <select value={form.layout} onChange={(e) => setForm({ ...form, layout: e.target.value as CategoryForm['layout'] })} style={inputStyle}>
                    <option value="grid">Grid</option>
                    <option value="list">List</option>
                    <option value="magazine">Magazine</option>
                    <option value="masonry">Masonry</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Posts Per Page</label>
                  <input type="number" min={1} max={100} value={form.postsPerPage} onChange={(e) => setForm({ ...form, postsPerPage: Number(e.target.value) })} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={form.showInNav} onChange={(e) => setForm({ ...form, showInNav: e.target.checked })} /> Show in Nav
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={form.showInSidebar} onChange={(e) => setForm({ ...form, showInSidebar: e.target.checked })} /> Show in Sidebar
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={form.showInFooter} onChange={(e) => setForm({ ...form, showInFooter: e.target.checked })} /> Show in Footer
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
