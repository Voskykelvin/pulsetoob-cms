'use client'
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Views', value: data.overview?.totalViews?.toLocaleString() || 0 },
              { label: 'Unique Visitors', value: data.overview?.uniqueVisitors?.toLocaleString() || 0 },
              { label: 'Avg Duration', value: `${data.overview?.avgDuration || 0}s` },
              { label: 'Bounce Rate', value: `${data.overview?.bounceRate || 0}%` },
            ].map((card, i) => (
              <div key={i} className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm">
                <p className="text-xs text-gray-400 font-semibold uppercase">{card.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">{card.value}</p>
              </div>
            ))}
          </div>

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
                        style={{ height: `${pct}%` }}
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
}
