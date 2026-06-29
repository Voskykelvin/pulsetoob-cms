'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { getApiErrorMessage } from '@/utils/apiError'
import type { ApiResponse, Article } from '@/types/cms'

type HomepageArticle = Article & {
  excerpt?: string | null
  readTime?: number | null
}

function formatDate(value?: string | null) {
  if (!value) return 'Unpublished'
  return new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ArticleRow({
  article,
  onPin,
  onUnpin,
  onFeature,
  busy,
}: {
  article: HomepageArticle
  onPin: (article: HomepageArticle) => void
  onUnpin: (article: HomepageArticle) => void
  onFeature: (article: HomepageArticle) => void
  busy: boolean
}) {
  return (
    <article className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-gray-950">{article.title}</h3>
          {article.isPinned && <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-700 ring-1 ring-green-200">Lead</span>}
          {article.isFeatured && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 ring-1 ring-blue-200">Featured</span>}
        </div>
        <p className="line-clamp-2 text-sm text-gray-500">{article.excerpt || `/${article.slug}`}</p>
        <div className="flex flex-wrap gap-3 text-xs font-medium text-gray-400">
          <span>{formatDate(article.publishedAt || article.createdAt)}</span>
          <span>{article.views || 0} views</span>
          <Link href={`/article/${article.slug}`} target="_blank" className="text-green-700 hover:underline">
            View public
          </Link>
          <Link href={`/admin/articles/${article.id}`} className="text-blue-700 hover:underline">
            Edit
          </Link>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 sm:justify-end">
        {article.isPinned ? (
          <button
            type="button"
            onClick={() => onUnpin(article)}
            disabled={busy}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Release Lead
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onPin(article)}
            disabled={busy}
            className="rounded-lg bg-green-700 px-3 py-2 text-xs font-bold text-white hover:bg-green-800 disabled:opacity-50"
          >
            Make Lead
          </button>
        )}
        <button
          type="button"
          onClick={() => onFeature(article)}
          disabled={busy}
          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
        >
          {article.isFeatured ? 'Remove Featured' : 'Add Featured'}
        </button>
      </div>
    </article>
  )
}

export default function AdminHomepagePage() {
  const [latestArticles, setLatestArticles] = useState<HomepageArticle[]>([])
  const [featuredArticles, setFeaturedArticles] = useState<HomepageArticle[]>([])
  const [pinnedArticles, setPinnedArticles] = useState<HomepageArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const currentLead = useMemo(
    () => pinnedArticles[0] || featuredArticles[0] || latestArticles[0] || null,
    [featuredArticles, latestArticles, pinnedArticles]
  )

  const fetchHomepageArticles = async () => {
    try {
      setLoading(true)
      const [latestRes, featuredRes, pinnedRes] = await Promise.all([
        api.get<ApiResponse<HomepageArticle[]>>('/articles', { params: { status: 'published', limit: 12, sortBy: 'publishedAt', sortOrder: 'DESC' } }),
        api.get<ApiResponse<HomepageArticle[]>>('/articles', { params: { status: 'published', limit: 12, featured: 'true', sortBy: 'publishedAt', sortOrder: 'DESC' } }),
        api.get<ApiResponse<HomepageArticle[]>>('/articles', { params: { status: 'published', limit: 5, pinned: 'true', sortBy: 'publishedAt', sortOrder: 'DESC' } }),
      ])

      setLatestArticles(latestRes.data.success ? latestRes.data.data : [])
      setFeaturedArticles(featuredRes.data.success ? featuredRes.data.data : [])
      setPinnedArticles(pinnedRes.data.success ? pinnedRes.data.data : [])
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not load homepage articles'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHomepageArticles()
  }, [])

  const updateArticleFlags = async (article: HomepageArticle, updates: Partial<Pick<HomepageArticle, 'isPinned' | 'isFeatured'>>) => {
    try {
      setBusyId(article.id)
      await api.put(`/articles/${article.id}`, updates)
      toast.success('Homepage settings updated')
      await fetchHomepageArticles()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not update homepage settings'))
    } finally {
      setBusyId(null)
    }
  }

  const rotationPool = featuredArticles.filter((article) => !article.isPinned)

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-green-700">PulseToob</p>
          <h1 className="text-2xl font-bold text-gray-950">Homepage Control</h1>
          <p className="mt-1 text-sm text-gray-500">Choose the lead story, curate the featured rotation, and keep the homepage intentional.</p>
        </div>
        <Link href="/admin/articles/new" className="rounded-lg bg-green-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-800">
          New Article
        </Link>
      </div>

      <section className="rounded-lg border border-green-200 bg-green-50 p-5">
        <p className="text-xs font-extrabold uppercase tracking-wide text-green-700">Current Lead</p>
        {loading ? (
          <div className="mt-4 h-24 animate-pulse rounded-lg bg-green-100" />
        ) : currentLead ? (
          <div className="mt-4 rounded-lg border border-green-200 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <h2 className="text-xl font-extrabold text-gray-950">{currentLead.title}</h2>
                <p className="max-w-3xl text-sm leading-relaxed text-gray-600">{currentLead.excerpt || 'No excerpt available.'}</p>
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-gray-400">
                  <span>{currentLead.isPinned ? 'Pinned lead' : currentLead.isFeatured ? 'Featured rotation' : 'Newest fallback'}</span>
                  <span>{formatDate(currentLead.publishedAt || currentLead.createdAt)}</span>
                </div>
              </div>
              <Link href={`/admin/articles/${currentLead.id}`} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">
                Edit Lead
              </Link>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-green-800">No published articles are available yet.</p>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-gray-950">Featured Rotation</h2>
          <p className="text-sm text-gray-500">When no article is pinned, the homepage lead rotates through these featured stories hourly.</p>
        </div>
        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-100" />)}</div>
        ) : rotationPool.length > 0 ? (
          <div className="space-y-3">
            {rotationPool.map((article) => (
              <ArticleRow
                key={article.id}
                article={article}
                busy={busyId === article.id}
                onPin={(item) => updateArticleFlags(item, { isPinned: true, isFeatured: true })}
                onUnpin={(item) => updateArticleFlags(item, { isPinned: false })}
                onFeature={(item) => updateArticleFlags(item, { isFeatured: !item.isFeatured })}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
            No featured stories yet. Add one from the recent published list below.
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-gray-950">Recent Published Stories</h2>
          <p className="text-sm text-gray-500">Promote any recent story into the lead slot or featured rotation.</p>
        </div>
        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-100" />)}</div>
        ) : latestArticles.length > 0 ? (
          <div className="space-y-3">
            {latestArticles.map((article) => (
              <ArticleRow
                key={article.id}
                article={article}
                busy={busyId === article.id}
                onPin={(item) => updateArticleFlags(item, { isPinned: true, isFeatured: true })}
                onUnpin={(item) => updateArticleFlags(item, { isPinned: false })}
                onFeature={(item) => updateArticleFlags(item, { isFeatured: !item.isFeatured })}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
            No published stories found.
          </div>
        )}
      </section>
    </div>
  )
}
