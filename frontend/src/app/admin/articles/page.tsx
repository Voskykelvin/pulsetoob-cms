'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import Link from 'next/link'
import toast from 'react-hot-toast'
import StatusBadge from '@/components/admin/StatusBadge'
import { getApiErrorMessage } from '@/utils/apiError'
import type { ApiResponse, Article, ArticleStatus, Pagination } from '@/types/cms'

const EMPTY_PAGINATION: Pagination = {
  total: 0,
  page: 1,
  limit: 15,
  pages: 0,
  hasNext: false,
  hasPrev: false,
}

export default function ArticlesPage() {
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | ''>('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination>(EMPTY_PAGINATION)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { 
      router.push('/login')
      return 
    }
    fetchArticles()
  }, [page, statusFilter, search, router])

  const fetchArticles = async () => {
    try {
      setLoading(true)
      const params: { page: number; limit: number; status?: ArticleStatus; search?: string } = { page, limit: 15 }
      if (statusFilter) params.status = statusFilter
      if (search) params.search = search
      const res = await api.get<ApiResponse<Article[]>>('/articles', { params })
      if (res.data.success) { 
        setArticles(res.data.data) 
        setPagination(res.data.pagination || EMPTY_PAGINATION) 
      }
    } catch (err) {
      console.error(err)
    } finally { 
      setLoading(false) 
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this article?')) return
    try { 
      await api.delete(`/articles/${id}`)
      toast.success('Article deleted')
      fetchArticles() 
    } catch (err) { 
      toast.error(getApiErrorMessage(err, 'Delete failed'))
    }
  }

  const handlePublish = async (id: string) => {
    try { 
      await api.post(`/articles/${id}/publish`)
      toast.success('Article published')
      fetchArticles() 
    } catch (err) { 
      toast.error(getApiErrorMessage(err, 'Publish failed'))
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
          <span style={{ fontWeight: '600', color: '#111827' }}>PulseToob</span>
          <span>&gt;</span>
          <span>Articles</span>
        </div>
        <Link href="/admin/articles/new" style={{ padding: '0.5rem 1.25rem', background: '#16a34a', color: 'white', textDecoration: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600' }}>
          + New Article
        </Link>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e5e7eb', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input 
          type="text" 
          placeholder="Search articles..." 
          value={search} 
          onChange={(e) => { setSearch(e.target.value); setPage(1) }} 
          style={{ padding: '0.5rem 1rem', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', flex: 1, minWidth: '200px', outline: 'none' }} 
        />
        <select 
          value={statusFilter} 
          onChange={(e) => { setStatusFilter(e.target.value as ArticleStatus | ''); setPage(1) }} 
          style={{ padding: '0.5rem 1rem', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', outline: 'none' }}
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
        </select>
        <span style={{ color: '#6b7280', fontSize: '0.875rem', marginLeft: 'auto' }}>
          {pagination.total || 0} articles
        </span>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Title</th>
              <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Views</th>
              <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Date</th>
              <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td colSpan={5} style={{ padding: '1rem' }}>
                    <div style={{ height: '16px', background: '#f3f4f6', borderRadius: '4px' }} />
                  </td>
                </tr>
              ))
            ) : articles.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                  No articles found. <Link href="/admin/articles/new" style={{ color: '#16a34a' }}>Create your first article</Link>
                </td>
              </tr>
            ) : articles.map((article) => (
                <tr key={article.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: '500', color: '#111827', fontSize: '0.9rem' }}>{article.title}</div>
                    <div style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.2rem' }}>/{article.slug}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <StatusBadge status={article.status} />
                  </td>
                  <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>{article.views || 0}</td>
                  <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.8rem' }}>
                    {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : new Date(article.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <Link 
                        href={`/admin/articles/${article.id}`} 
                        style={{ padding: '0.375rem 0.75rem', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                      >
                        Edit
                      </Link>

                      {article.status !== 'published' && (
                        <button onClick={() => handlePublish(article.id)} style={{ padding: '0.375rem 0.75rem', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                          Publish
                        </button>
                      )}
                      
                      <button onClick={() => handleDelete(article.id)} style={{ padding: '0.375rem 0.75rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '0.5rem 1rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>
            Previous
          </button>
          <span style={{ padding: '0.5rem 1rem', color: '#6b7280', fontSize: '0.875rem' }}>
            Page {page} of {pagination.pages}
          </span>
          <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} style={{ padding: '0.5rem 1rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white', cursor: page === pagination.pages ? 'not-allowed' : 'pointer', opacity: page === pagination.pages ? 0.5 : 1 }}>
            Next
          </button>
        </div>
      )}
    </div>
  )
}
