'use client'
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
              <p className={`text-xl font-bold mt-1.5 ${stat.color || 'text-gray-800'}`}>{stat.value}</p>
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
}
