'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { getApiBaseUrl } from '@/utils/apiBase'

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

  const apiUrl = getApiBaseUrl().replace(/\/api$/, '')

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

      {categories.length > 0 && (
        <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm">
          <h3 className="text-base font-bold text-gray-900 border-b pb-3 mb-4">Category Specific Feeds</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories.filter(c => c.rssEnabled).map((cat: any) => {
              const url = `${apiUrl}/api/rss/category/${cat.slug}`
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

      <div className="bg-green-50 border border-green-200 p-5 rounded-xl">
        <h3 className="text-sm font-bold text-green-800 mb-2">Syndication Best Practices</h3>
        <ul className="list-disc list-inside text-sm text-green-800 space-y-1.5 pl-2">
          <li>Submit your main feed to aggregators like Google News Producer or Bing Publisher Center.</li>
          <li>Use segment-specific category feeds for targeted partner distributions.</li>
          <li>Avoid altering feed slugs unexpectedly as aggregators crawl link formats automatically.</li>
          <li>MSN feed updates strictly match approved article selections.</li>
        </ul>
      </div>
    </div>
  )
}
