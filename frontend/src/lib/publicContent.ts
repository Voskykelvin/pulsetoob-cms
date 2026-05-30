import { getApiBaseUrl } from '@/utils/apiBase'
import { getImageUrl as resolveImageUrl } from '@/utils/imageUrl'
import type { ApiResponse, Category, MediaAsset, Pagination, UserSummary } from '@/types/cms'

export interface PublicTag {
  id: string
  name: string
  slug: string
}

export interface PublicArticle {
  id: string
  title: string
  slug: string
  subtitle?: string | null
  excerpt?: string | null
  content?: string | null
  contentPlainText?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  metaKeywords?: string[] | null
  canonicalUrl?: string | null
  ogImage?: string | null
  ogTitle?: string | null
  ogDescription?: string | null
  readTime?: number | null
  wordCount?: number | null
  status?: string
  createdAt?: string
  updatedAt?: string | null
  publishedAt?: string | null
  author?: UserSummary | null
  categories?: Category[]
  featuredImage?: MediaAsset | string | null
  tags?: PublicTag[]
}

interface ArticleListResponse extends ApiResponse<PublicArticle[]> {
  pagination?: Pagination
}

const API_URL = getApiBaseUrl()
const REQUEST_TIMEOUT_MS = 8000

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pulsetoob.com').replace(/\/+$/, '')
}

async function fetchJson<T>(path: string): Promise<T | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
    })

    if (!response.ok) return null
    return (await response.json()) as T
  } catch (error) {
    console.error(`Public content fetch failed: ${url}`, error)
    return null
  } finally {
    clearTimeout(timeout)
  }
}

export async function getPublicArticles(options: { limit?: number; category?: string } = {}) {
  const params = new URLSearchParams({
    limit: String(options.limit || 12),
    status: 'published',
    sortBy: 'publishedAt',
    sortOrder: 'DESC',
  })

  if (options.category) params.set('category', options.category)

  const result = await fetchJson<ArticleListResponse>(`/articles?${params.toString()}`)
  return result?.success ? result.data : []
}

export async function getPublicCategories() {
  const result = await fetchJson<ApiResponse<Category[]>>('/categories?active=true')
  return result?.success ? result.data : []
}

export async function getPublicArticle(slug: string, options: { trackView?: boolean } = {}) {
  const params = new URLSearchParams()
  if (options.trackView === false) params.set('trackView', 'false')

  const query = params.toString()
  const result = await fetchJson<ApiResponse<PublicArticle>>(`/articles/${encodeURIComponent(slug)}${query ? `?${query}` : ''}`)

  return result?.success ? result.data : null
}

export function getArticleUrl(article: Pick<PublicArticle, 'slug'>) {
  return `${getSiteUrl()}/article/${article.slug}`
}

export function getFeaturedImageUrl(featuredImage?: PublicArticle['featuredImage']) {
  if (!featuredImage) return null
  if (typeof featuredImage === 'string') return resolveImageUrl(featuredImage)
  return resolveImageUrl(featuredImage.url || featuredImage.thumbnailUrl || null)
}

export function getFeaturedImageAlt(article: Pick<PublicArticle, 'title' | 'featuredImage'>) {
  const image = article.featuredImage
  if (image && typeof image === 'object' && image.altText) return image.altText
  return article.title
}

export function getArticleDescription(article: Pick<PublicArticle, 'metaDescription' | 'excerpt' | 'contentPlainText'>) {
  return (
    article.metaDescription ||
    article.excerpt ||
    article.contentPlainText?.slice(0, 160) ||
    'Read the latest story from PulseToob.'
  )
}
