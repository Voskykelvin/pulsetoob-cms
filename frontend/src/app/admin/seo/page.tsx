'use client'
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
                    <div key={article.id} className={`flex justify-between items-center p-3 border rounded-lg ${scoreBg(article.score)}`}>
                      <span className="text-sm font-medium text-gray-800 truncate max-w-[280px]" title={article.title}>{article.title}</span>
                      <span className={`text-sm font-bold ${scoreColor(article.score)}`}>{article.score} pts</span>
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
}
