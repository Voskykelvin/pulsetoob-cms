const fs = require('fs');

// Media Library Page
const mediaPage = `'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

interface MediaItem {
  id: string
  originalName: string
  mimeType: string
  type: 'image' | 'video' | 'audio' | 'document'
  size: number
  url: string
}

export default function MediaPage() {
  const router = useRouter()
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [filter, setFilter] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    fetchMedia()
  }, [filter, router])

  const fetchMedia = async () => {
    try {
      setLoading(true)
      const params: any = { limit: 24 }
      if (filter) params.type = filter
      const res = await api.get('/media', { params })
      if (res.data.success) { 
        setMedia(res.data.data) 
      }
    } catch (err) {
      console.error(err)
    } finally { 
      setLoading(false) 
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData()
        formData.append('file', files[i])
        const isVideo = files[i].type.startsWith('video/')
        await api.post('/media/upload/' + (isVideo ? 'video' : 'image'), formData, { 
          headers: { 'Content-Type': 'multipart/form-data' } 
        })
      }
      alert(files.length + ' file(s) uploaded!')
      fetchMedia()
    } catch (err) { 
      alert('Upload failed') 
    } finally { 
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return
    try { 
      await api.delete('/media/' + id)
      fetchMedia() 
    } catch (err: any) { 
      alert(err.response?.data?.error || 'Delete failed') 
    }
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    alert('URL copied to clipboard!')
  }

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
          <p className="text-sm text-gray-500 mt-1">Upload and manage images and videos used in your articles.</p>
        </div>
        <div>
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleUpload}
            className="hidden"
            id="media-upload"
          />
          <label
            htmlFor="media-upload"
            className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium cursor-pointer transition-colors inline-block text-sm shadow-sm"
          >
            {uploading ? 'Uploading...' : '📤 Upload Files'}
          </label>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 border-b border-gray-200 pb-4">
        {[
          { value: '', label: '📁 All Files' },
          { value: 'image', label: '🖼️ Images' },
          { value: 'video', label: '🎬 Videos' },
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => setFilter(item.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === item.value
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-transparent'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : media.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
          No media files found. Upload your first file!
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {media.map((item) => (
            <div key={item.id} className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="aspect-square w-full bg-gray-50 relative flex items-center justify-center overflow-hidden">
                {item.type === 'image' ? (
                  <img src={item.url} alt={item.originalName} className="object-cover w-full h-full" />
                ) : (
                  <div className="text-4xl">🎬</div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => copyToClipboard(item.url)}
                    className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 text-xs font-semibold"
                    title="Copy URL"
                  >
                    🔗
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 bg-red-600 rounded-full text-white hover:bg-red-700 text-xs font-semibold"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs font-medium text-gray-800 truncate" title={item.originalName}>
                  {item.originalName}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">{formatSize(item.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}`;

// Analytics Page
const analyticsPage = `'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function AnalyticsPage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7d')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    fetchAnalytics()
  }, [period, router])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const res = await api.get('/analytics/dashboard', { params: { period } })
      if (res.data.success) setData(res.data.data)
    } catch (err) {
      console.error(err)
    } finally { 
      setLoading(false) 
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Track views, reader engagement, and traffic sources.</p>
        </div>
        <div className="flex gap-1 bg-white border border-gray-200 p-1 rounded-lg">
          {['24h', '7d', '30d', '90d'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                period === p
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-28 rounded-xl" />
          ))}
        </div>
      ) : !data ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
          No analytics data found for this period.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: '👁️ Total Views', value: data.overview?.totalViews?.toLocaleString() || 0 },
              { label: '👥 Unique Visitors', value: data.overview?.uniqueVisitors?.toLocaleString() || 0 },
              { label: '⏱️ Avg Duration', value: \`\${data.overview?.avgDuration || 0}s\` },
              { label: '📉 Bounce Rate', value: \`\${data.overview?.bounceRate || 0}%\` },
            ].map((card, i) => (
              <div key={i} className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm">
                <p className="text-xs text-gray-400 font-semibold uppercase">{card.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Reports */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 border-b pb-3">Traffic Sources</h3>
              <div className="mt-4 space-y-3">
                {data.trafficSources?.length > 0 ? (
                  data.trafficSources.map((s: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{s.source || 'Direct / Referral'}</span>
                      <span className="font-semibold text-gray-800">{s.count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400">No traffic sources recorded yet.</p>
                )}
              </div>
            </div>

            <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 border-b pb-3">Device Breakdown</h3>
              <div className="mt-4 space-y-3">
                {data.deviceBreakdown?.length > 0 ? (
                  data.deviceBreakdown.map((d: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 capitalize">{d.device}</span>
                      <span className="font-semibold text-gray-800">{d.count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400">No device data recorded yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Daily Chart */}
          {data.viewsByDay?.length > 0 && (
            <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 border-b pb-3 mb-6">Views by Day</h3>
              <div className="flex justify-between items-end h-48 gap-2">
                {data.viewsByDay.map((day: any, i: number) => {
                  const max = Math.max(...data.viewsByDay.map((d: any) => parseInt(d.views)))
                  const pct = max > 0 ? (parseInt(day.views) / max) * 100 : 0
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center group h-full justify-end">
                      <div className="text-[10px] text-gray-500 font-semibold mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {day.views}
                      </div>
                      <div
                        style={{ height: \`\${pct}%\` }}
                        className="w-full bg-green-500 group-hover:bg-green-600 rounded-t-sm transition-all min-h-[4px]"
                      />
                      <div className="text-[9px] text-gray-400 mt-2 truncate w-full text-center">
                        {new Date(day.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}`;

// SEO Tools Page
const seoPage = `'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function SEOPage() {
  const router = useRouter()
  const [overview, setOverview] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    fetchOverview()
  }, [router])

  const fetchOverview = async () => {
    try { 
      setLoading(true)
      const res = await api.get('/seo/overview')
      if (res.data.success) setOverview(res.data.data) 
    } catch (err) {
      console.error(err)
    } finally { 
      setLoading(false) 
    }
  }

  const runBulkAnalysis = async () => {
    setAnalyzing(true)
    try { 
      const res = await api.post('/seo/bulk-analyze')
      if (res.data.success) { 
        alert('Bulk analysis finished!') 
        fetchOverview() 
      } 
    } catch (err) { 
      alert('Analysis failed') 
    } finally { 
      setAnalyzing(false) 
    }
  }

  const scoreColor = (score: number) => score >= 80 ? 'text-green-600' : score >= 60 ? 'text-amber-600' : 'text-red-600'
  const scoreBg = (score: number) => score >= 80 ? 'bg-green-50 border-green-200' : score >= 60 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SEO Tools</h1>
          <p className="text-sm text-gray-500 mt-1">Audit, check schema markup, and optimize search rankings.</p>
        </div>
        <button
          onClick={runBulkAnalysis}
          disabled={analyzing}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors"
        >
          {analyzing ? 'Analyzing Articles...' : '🔍 Run Bulk Analysis'}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-28 rounded-xl" />
          ))}
        </div>
      ) : !overview ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
          No SEO analysis recorded yet. Create and publish articles to see scores!
        </div>
      ) : (
        <div className="space-y-6">
          {/* Distribution report */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm text-center">
              <p className="text-xs text-gray-400 font-bold uppercase">Average Score</p>
              <p className="text-4xl font-extrabold text-green-600 mt-2">{overview.avgScore}/100</p>
            </div>
            <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm">
              <p className="text-xs text-gray-400 font-bold uppercase">Excellent (80+)</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">{overview.distribution?.excellent || 0}</p>
            </div>
            <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm">
              <p className="text-xs text-gray-400 font-bold uppercase">Good (60-79)</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">{overview.distribution?.good || 0}</p>
            </div>
            <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm">
              <p className="text-xs text-gray-400 font-bold uppercase">Needs Work (&lt;60)</p>
              <p className="text-2xl font-bold text-red-600 mt-2">
                {(overview.distribution?.fair || 0) + (overview.distribution?.poor || 0)}
              </p>
            </div>
          </div>

          {/* Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 border-b pb-3 mb-4">🚨 Needs Attention</h3>
              {overview.needsImprovement?.length > 0 ? (
                <div className="space-y-3">
                  {overview.needsImprovement.map((article: any) => (
                    <div key={article.id} className={\`flex justify-between items-center p-3 border rounded-lg \${scoreBg(article.score)}\`}>
                      <span className="text-sm font-medium text-gray-800 truncate max-w-[280px]" title={article.title}>{article.title}</span>
                      <span className={\`text-sm font-bold \${scoreColor(article.score)}\`}>{article.score} pts</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">Perfect! All of your published articles meet optimal SEO scores.</p>
              )}
            </div>

            <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 border-b pb-3 mb-4">⭐ Top SEO Performers</h3>
              {overview.topPerformers?.length > 0 ? (
                <div className="space-y-3">
                  {overview.topPerformers.map((article: any) => (
                    <div key={article.id} className="flex justify-between items-center p-3 border border-gray-100 bg-gray-50 rounded-lg">
                      <div className="max-w-[240px] truncate">
                        <p className="text-sm font-medium text-gray-800 truncate" title={article.title}>{article.title}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{article.views} views</p>
                      </div>
                      <span className="text-sm font-bold text-green-600">{article.score} pts</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No article meets the excellent (80+) ranking metrics yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}`;

// Backlinks Page
const backlinksPage = `'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function BacklinksPage() {
  const router = useRouter()
  const [backlinks, setBacklinks] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    fetchData()
  }, [router])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [linksRes, statsRes] = await Promise.all([
        api.get('/backlinks'), 
        api.get('/backlinks/stats')
      ])
      if (linksRes.data.success) setBacklinks(linksRes.data.data)
      if (statsRes.data.success) setStats(statsRes.data.data)
    } catch (err) {
      console.error(err)
    } finally { 
      setLoading(false) 
    }
  }

  const checkHealth = async () => {
    setChecking(true)
    try {
      const res = await api.post('/backlinks/check-health', {})
      if (res.data.success) { 
        alert('Checked link health successfully!')
        fetchData() 
      }
    } catch (err) { 
      alert('Health check failed') 
    } finally { 
      setChecking(false) 
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this backlink?')) return
    try { 
      await api.delete('/backlinks/' + id)
      fetchData() 
    } catch (err) { 
      alert('Delete failed') 
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Backlinks</h1>
          <p className="text-sm text-gray-500 mt-1">Audit external, internal, and sponsored link states inside articles.</p>
        </div>
        <button
          onClick={checkHealth}
          disabled={checking}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
        >
          {checking ? 'Checking Links...' : '🔗 Check Link Health'}
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: 'Total Links', value: stats.total },
            { label: 'Active', value: stats.active, color: 'text-green-600' },
            { label: 'Broken', value: stats.broken, color: stats.broken > 0 ? 'text-red-600' : 'text-gray-800' },
            { label: 'DoFollow', value: stats.dofollow },
            { label: 'NoFollow', value: stats.nofollow },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-4 border border-gray-200 rounded-xl shadow-sm text-center">
              <p className="text-xs text-gray-400 font-semibold uppercase">{stat.label}</p>
              <p className={\`text-xl font-bold mt-1.5 \${stat.color || 'text-gray-800'}\`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-gray-500 animate-pulse">Loading links...</div>
        ) : backlinks.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No backlinks tracked yet. Link references will be generated dynamically as you publish.
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="p-4 text-xs font-bold text-gray-600 uppercase">Target Link</th>
                <th className="p-4 text-xs font-bold text-gray-600 uppercase">Relationship</th>
                <th className="p-4 text-xs font-bold text-gray-600 uppercase">Status</th>
                <th className="p-4 text-xs font-bold text-gray-600 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {backlinks.map((link: any) => (
                <tr key={link.id} className="border-b border-gray-100 text-sm hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-semibold text-gray-800 truncate max-w-sm" title={link.url}>
                      {link.url}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Anchor: "{link.anchorText}"</div>
                  </td>
                  <td className="p-4 capitalize">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                      {link.relationship}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={\`px-2 py-1 text-xs font-medium rounded \${
                      link.isBroken
                        ? 'bg-red-50 border border-red-200 text-red-600'
                        : 'bg-green-50 border border-green-200 text-green-600'
                    }\`}>
                      {link.isBroken ? 'Broken' : \`OK (\${link.httpStatus || 200})\`}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="px-2.5 py-1 bg-red-50 border border-red-200 text-red-600 rounded text-xs font-semibold hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}`;

// MSN Page
const msnPage = `'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function MSNPage() {
  const router = useRouter()
  const [articles, setArticles] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    fetchData()
  }, [router])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [articlesRes, statsRes] = await Promise.all([
        api.get('/msn/articles'), 
        api.get('/msn/stats')
      ])
      if (articlesRes.data.success) setArticles(articlesRes.data.data)
      if (statsRes.data.success) setStats(statsRes.data.data)
    } catch (err) {
      console.error(err)
    } finally { 
      setLoading(false) 
    }
  }

  const toggleEligibility = async (id: string) => {
    try { 
      await api.post('/msn/toggle/' + id)
      fetchData() 
    } catch (err: any) { 
      alert(err.response?.data?.error || err.response?.data?.issues?.join(', ') || 'Failed') 
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">MSN News Syndication</h1>
        <p className="text-sm text-gray-500 mt-1">Submit, format, and audit stories matching MSN content standards.</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'MSN Eligible', value: stats.totalEligible },
            { label: 'Submitted', value: stats.totalSubmitted },
            { label: 'Approved', value: stats.approved, color: 'text-green-600' },
            { label: 'Rejected', value: stats.rejected, color: stats.rejected > 0 ? 'text-red-600' : 'text-gray-800' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-4 border border-gray-200 rounded-xl shadow-sm text-center">
              <p className="text-xs text-gray-400 font-semibold uppercase">{stat.label}</p>
              <p className={\`text-xl font-bold mt-1.5 \${stat.color || 'text-gray-800'}\`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {stats?.feedUrl && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex justify-between items-center">
          <div className="text-sm text-green-800">
            <span className="font-bold">MSN Feed URL: </span>
            <code className="font-mono bg-green-100 px-2 py-0.5 rounded select-all">{stats.feedUrl}</code>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(stats.feedUrl)
              alert('Feed URL copied!')
            }}
            className="text-xs font-semibold px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            Copy Feed URL
          </button>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-gray-500 animate-pulse">Loading list...</div>
        ) : articles.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No eligible articles found. Ensure posts are published, contain a featured image, and exceed 300 words.
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="p-4 text-xs font-bold text-gray-600 uppercase">Article Info</th>
                <th className="p-4 text-xs font-bold text-gray-600 uppercase">Status</th>
                <th className="p-4 text-xs font-bold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article: any) => (
                <tr key={article.id} className="border-b border-gray-100 text-sm hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-semibold text-gray-800 truncate max-w-sm">{article.title}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      By {article.author?.username || 'PulseToob'} • {new Date(article.publishedAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-green-50 border border-green-200 text-green-700 text-xs font-medium rounded">
                      {article.msnSubmitted ? 'Submitted' : 'Eligible'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleEligibility(article.id)}
                      className="px-2.5 py-1 bg-red-50 border border-red-200 text-red-600 rounded text-xs font-semibold hover:bg-red-100"
                    >
                      Remove Eligibility
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}`;

// RSS Page
const rssPage = `'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function RSSPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    api.get('/categories?flat=true')
      .then(res => { if (res.data.success) setCategories(res.data.data) })
      .catch(() => {})
  }, [router])

  const apiUrl = 'http://localhost:5000'

  const feeds = [
    { name: 'Main Syndication Feed', url: apiUrl + '/api/rss/feed', desc: 'Syndicate all published blog posts to aggregators.' },
    { name: 'MSN Core Feed', url: apiUrl + '/api/rss/msn', desc: 'Strict, compliant feed filtered specifically for MSN News.' },
  ]

  const copyFeed = (url: string) => {
    navigator.clipboard.writeText(url)
    alert('RSS Feed URL copied to clipboard!')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">RSS Syndication</h1>
        <p className="text-sm text-gray-500 mt-1">Syndicate categories or your global content stream directly to news publishers.</p>
      </div>

      {/* Core Feeds */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {feeds.map((feed, i) => (
          <div key={i} className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">{feed.name}</h3>
              <p className="text-sm text-gray-500 mt-1.5">{feed.desc}</p>
              <code className="text-xs font-mono block bg-gray-50 p-2 border border-gray-100 rounded mt-3 text-gray-600 truncate">
                {feed.url}
              </code>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => copyFeed(feed.url)}
                className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded hover:bg-green-100 flex-1"
              >
                Copy URL
              </button>
              <a
                href={feed.url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-semibold rounded hover:bg-gray-100 text-center"
              >
                Preview Feed
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Category Feeds */}
      {categories.length > 0 && (
        <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm">
          <h3 className="text-base font-bold text-gray-900 border-b pb-3 mb-4">Category Specific Feeds</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories.filter(c => c.rssEnabled).map((cat: any) => {
              const url = \`\${apiUrl}/api/rss/category/\${cat.slug}\`
              return (
                <div key={cat.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50 flex flex-col justify-between">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{cat.name} Feed</p>
                    <code className="text-[10px] font-mono block truncate bg-white p-1 border rounded mt-1.5 text-gray-500">
                      {url}
                    </code>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => copyFeed(url)}
                      className="px-2 py-1 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded hover:bg-green-100 flex-1"
                    >
                      Copy
                    </button>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-1 bg-white border border-gray-200 text-gray-600 text-xs font-semibold rounded hover:bg-gray-100"
                    >
                      Preview
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Information Card */}
      <div className="bg-green-50 border border-green-200 p-5 rounded-xl">
        <h3 className="text-sm font-bold text-green-800 mb-2">💡 Syndication Best Practices</h3>
        <ul className="list-disc list-inside text-sm text-green-800 space-y-1.5 pl-2">
          <li>Submit your main feed to aggregators like Google News Producer or Bing Publisher Center.</li>
          <li>Use segment-specific category feeds for targeted partner distributions.</li>
          <li>Avoid altering feed slugs unexpectedly as aggregators crawl link formats automatically.</li>
          <li>MSN feed updates strictly match approved article selections.</li>
        </ul>
      </div>
    </div>
  )
}`;

// Write all files
const pages = [
  { path: 'src/app/admin/media/page.tsx', content: mediaPage },
  { path: 'src/app/admin/analytics/page.tsx', content: analyticsPage },
  { path: 'src/app/admin/seo/page.tsx', content: seoPage },
  { path: 'src/app/admin/backlinks/page.tsx', content: backlinksPage },
  { path: 'src/app/admin/msn/page.tsx', content: msnPage },
  { path: 'src/app/admin/rss/page.tsx', content: rssPage },
];

pages.forEach(({ path: filePath, content }) => {
  const dir = require('path').dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content);
  console.log('Created: ' + filePath);
});

console.log('\nAll 6 admin pages created successfully!');
