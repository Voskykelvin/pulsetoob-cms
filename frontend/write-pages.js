const fs = require('fs');
const path = require('path');

// Articles page
const articlesPage = `'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function ArticlesPage() {
  const router = useRouter()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return }
    fetchArticles()
  }, [page, statusFilter, search])

  const fetchArticles = async () => {
    try {
      setLoading(true)
      const params = { page, limit: 15 }
      if (statusFilter) params.status = statusFilter
      if (search) params.search = search
      const res = await api.get('/articles', { params })
      if (res.data.success) { setArticles(res.data.data); setPagination(res.data.pagination) }
    } catch (err) {} finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this article?')) return
    try { await api.delete('/articles/' + id); fetchArticles() } catch (err) { alert('Delete failed') }
  }

  const handlePublish = async (id) => {
    try { await api.post('/articles/' + id + '/publish'); fetchArticles() } catch (err) { alert('Publish failed') }
  }

  const statusStyle = {
    published: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    draft: { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' },
    scheduled: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  }

  return (
    
      
        
          PulseToob
          /
          Articles
        
        + New Article
      

      
        
           { setSearch(e.target.value); setPage(1) }} style={{ padding: '0.5rem 1rem', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', flex: 1, minWidth: '200px', outline: 'none' }} />
           { setStatusFilter(e.target.value); setPage(1) }} style={{ padding: '0.5rem 1rem', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem' }}>
            All Status
            Published
            Draft
            Scheduled
          
          {pagination.total || 0} articles
        

        
          {loading ? (
            Loading...
          ) : articles.length === 0 ? (
            
              No articles found. Create your first article
            
          ) : (
            
                {articles.map((article) => {
                  const st = statusStyle[article.status] || statusStyle.draft
                  return (
                    
                  )
                })}
              
              
                
                  Title
                  Status
                  Views
                  Date
                  Actions
                
              
              
                      
                        {article.title}
                        /{article.slug}
                      
                      
                        {article.status}
                      
                      {article.views || 0}
                      {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : new Date(article.createdAt).toLocaleDateString()}
                      
                        
                          {article.status !== 'published' &&  handlePublish(article.id)} style={{ padding: '0.375rem 0.75rem', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Publish}
                           handleDelete(article.id)} style={{ padding: '0.375rem 0.75rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Delete
                        
                      
                    
            
          )}
        
      
    
  )
}`;

// New Article page
const newArticlePage = `'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function NewArticlePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({ title: '', content: '', excerpt: '', metaTitle: '', metaDescription: '', metaKeywords: '', categoryIds: [], isFeatured: false, isBreaking: false, rssIncluded: true })

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return }
    api.get('/categories?flat=true&active=true').then(res => { if (res.data.success) setCategories(res.data.data) }).catch(() => {})
  }, [])

  const handleSubmit = async (status) => {
    if (!form.title.trim()) return alert('Title is required')
    if (!form.content.trim()) return alert('Content is required')
    setSaving(true)
    try {
      const payload = { ...form, status, metaKeywords: form.metaKeywords ? form.metaKeywords.split(',').map(k => k.trim()) : [] }
      const res = await api.post('/articles', payload)
      if (res.data.success) { alert(status === 'published' ? 'Article published!' : 'Article saved!'); router.push('/admin/articles') }
    } catch (err) { alert(err.response?.data?.error || 'Failed to save') }
    finally { setSaving(false) }
  }

  const inputStyle = { width: '100%', padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none', fontFamily: 'sans-serif' }

  return (
    
      
        
          PulseToob
          /
          Articles
          /
          New
        
        
           handleSubmit('draft')} disabled={saving} style={{ padding: '0.5rem 1.25rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '0.875rem' }}>Save Draft
           handleSubmit('published')} disabled={saving} style={{ padding: '0.5rem 1.25rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600' }}>{saving ? 'Publishing...' : 'Publish Now'}
        
      

      
        
          
             setForm({ ...form, title: e.target.value })} style={{ width: '100%', padding: '0.875rem', border: 'none', borderBottom: '2px solid #e5e7eb', fontSize: '1.5rem', fontWeight: '700', outline: 'none', boxSizing: 'border-box', marginBottom: '1rem' }} />
             setForm({ ...form, content: e.target.value })} rows={18} style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.7' }} />
          </div>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Excerpt</h3>
            <textarea placeholder="Short description for previews..." value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>SEO Settings</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Meta Title ({form.metaTitle.length}/70)</label>
              <input type="text" value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} maxLength={70} placeholder="SEO title..." style={inputStyle} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Meta Description ({form.metaDescription.length}/160)</label>
              <textarea value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} maxLength={160} rows={3} placeholder="Description for search results..." style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Keywords (comma separated)</label>
              <input type="text" value={form.metaKeywords} onChange={(e) => setForm({ ...form, metaKeywords: e.target.value })} placeholder="keyword1, keyword2" style={inputStyle} />
            </div>
          </div>
        </div>

        <div>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e5e7eb', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '1rem' }}>Settings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /> Featured
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                <input type="checkbox" checked={form.isBreaking} onChange={(e) => setForm({ ...form, isBreaking: e.target.checked })} /> Breaking News
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                <input type="checkbox" checked={form.rssIncluded} onChange={(e) => setForm({ ...form, rssIncluded: e.target.checked })} /> Include in RSS
              </label>
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e5e7eb', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '1rem' }}>Categories</h3>
            {categories.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '0.8rem' }}>No categories. <a href="/admin/categories" style={{ color: '#16a34a' }}>Create one</a></p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                {categories.map((cat) => (
                  <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                    <input type="checkbox" checked={form.categoryIds.includes(cat.id)} onChange={(e) => setForm({ ...form, categoryIds: e.target.checked ? [...form.categoryIds, cat.id] : form.categoryIds.filter(id => id !== cat.id) })} />
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: cat.color || '#16a34a' }} />
                    {cat.name}
                  </label>
                ))}
              </div>
            )}
          </div>
          <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '1.25rem', border: '1px solid #bbf7d0' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.75rem', color: '#16a34a' }}>Tips</h3>
            <ul style={{ color: '#374151', fontSize: '0.8rem', lineHeight: '1.6', paddingLeft: '1rem', margin: 0 }}>
              <li>500+ words for better SEO</li>
              <li>Add a compelling excerpt</li>
              <li>Fill in meta title and description</li>
              <li>Select relevant categories</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}`;

// Categories page
const categoriesPage = `'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function CategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', color: '#22c55e', icon: '', showInNav: true, rssEnabled: true, msnEnabled: false, isFeatured: false })

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return }
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try { setLoading(true); const res = await api.get('/categories?flat=true'); if (res.data.success) setCategories(res.data.data) } catch (err) {} finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) { await api.put('/categories/' + editing.id, form); alert('Updated!') }
      else { await api.post('/categories', form); alert('Created!') }
      setShowModal(false); setEditing(null); setForm({ name: '', description: '', color: '#22c55e', icon: '', showInNav: true, rssEnabled: true, msnEnabled: false, isFeatured: false }); fetchCategories()
    } catch (err) { alert(err.response?.data?.error || 'Failed') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return
    try { await api.delete('/categories/' + id); fetchCategories() } catch (err) { alert('Delete failed') }
  }

  const openEdit = (cat) => {
    setEditing(cat); setForm({ name: cat.name, description: cat.description || '', color: cat.color || '#22c55e', icon: cat.icon || '', showInNav: cat.showInNav, rssEnabled: cat.rssEnabled, msnEnabled: cat.msnEnabled, isFeatured: cat.isFeatured }); setShowModal(true)
  }

  const inputStyle = { width: '100%', padding: '0.625rem', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', boxSizing: 'border-box', outline: 'none' }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'sans-serif' }}>
      <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 2rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <a href="/admin" style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.25rem' }}>PulseToob</a>
          <span style={{ color: '#9ca3af' }}>/</span>
          <span style={{ fontWeight: '600' }}>Categories</span>
        </div>
        <button onClick={() => { setEditing(null); setForm({ name: '', description: '', color: '#22c55e', icon: '', showInNav: true, rssEnabled: true, msnEnabled: false, isFeatured: false }); setShowModal(true) }} style={{ padding: '0.5rem 1.25rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>+ New Category</button>
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
}`;

// Write files
fs.writeFileSync('src/app/admin/articles/page.tsx', articlesPage);
console.log('Written: src/app/admin/articles/page.tsx');

fs.mkdirSync('src/app/admin/articles/new', { recursive: true });
fs.writeFileSync('src/app/admin/articles/new/page.tsx', newArticlePage);
console.log('Written: src/app/admin/articles/new/page.tsx');

fs.mkdirSync('src/app/admin/categories', { recursive: true });
fs.writeFileSync('src/app/admin/categories/page.tsx', categoriesPage);
console.log('Written: src/app/admin/categories/page.tsx');

console.log('Done! All pages created.');
