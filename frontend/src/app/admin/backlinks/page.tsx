'use client'
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
          {checking ? 'Checking Links...' : 'Check Link Health'}
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
              <p className={`text-xl font-bold mt-1.5 ${stat.color || 'text-gray-800'}`}>{stat.value}</p>
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
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      link.isBroken
                        ? 'bg-red-50 border border-red-200 text-red-600'
                        : 'bg-green-50 border border-green-200 text-green-600'
                    }`}>
                      {link.isBroken ? 'Broken' : `OK (${link.httpStatus || 200})`}
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
}
