import { getApiBaseUrl } from '@/utils/apiBase'
import { getImageUrl as resolveImageUrl } from '@/utils/imageUrl'
import { getSiteUrl as resolveSiteUrl } from '@/utils/siteUrl'
import type { ApiResponse, Category, MediaAsset, Pagination, UserSummary } from '@/types/cms'

export interface PublicTag {
  id: string
  name: string
  slug: string
}

export interface PublicBacklink {
  id: string
  url: string
  anchorText: string
  targetUrl?: string | null
  type?: 'internal' | 'external' | 'affiliate' | 'sponsored'
  relationship?: 'dofollow' | 'nofollow' | 'ugc' | 'sponsored'
  position?: 'content' | 'sidebar' | 'footer' | 'author_bio'
  isActive?: boolean
  isBroken?: boolean
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
  isFeatured?: boolean
  isBreaking?: boolean
  isPinned?: boolean
  createdAt?: string
  updatedAt?: string | null
  publishedAt?: string | null
  author?: UserSummary | null
  categories?: Category[]
  featuredImage?: MediaAsset | string | null
  tags?: PublicTag[]
  backlinks?: PublicBacklink[]
}

export interface PublicAuthor extends UserSummary {
  createdAt?: string
  updatedAt?: string | null
}

interface ArticleListResponse extends ApiResponse<PublicArticle[]> {
  pagination?: Pagination
}

type RelatedArticlesResponse = ApiResponse<PublicArticle[]>

const API_URL = getApiBaseUrl()
const REQUEST_TIMEOUT_MS = 7000
const PUBLIC_CONTENT_REVALIDATE_SECONDS = 60

export class PublicContentFetchError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'PublicContentFetchError'
    this.status = status
  }
}

export { getSiteUrl } from '@/utils/siteUrl'

async function fetchJson<T>(
  path: string,
  options: { revalidate?: number; timeoutMs?: number } = {}
): Promise<T | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || REQUEST_TIMEOUT_MS)
  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`

  try {
    const response = await fetch(url, {
      next: { revalidate: options.revalidate ?? PUBLIC_CONTENT_REVALIDATE_SECONDS },
      signal: controller.signal,
    })

    if (response.status === 404) return null
    if (!response.ok) {
      throw new PublicContentFetchError(`Public content API returned ${response.status}`, response.status)
    }

    return (await response.json()) as T
  } catch (error) {
    if (error instanceof PublicContentFetchError) throw error

    console.error(`Public content fetch failed: ${url}`, error)
    throw new PublicContentFetchError(
      error instanceof Error && error.name === 'AbortError'
        ? 'Public content API timed out'
        : 'Public content API is unavailable'
    )
  } finally {
    clearTimeout(timeout)
  }
}

export async function getPublicArticles(options: { limit?: number; category?: string; tag?: string; author?: string; search?: string; featured?: boolean; breaking?: boolean; pinned?: boolean } = {}) {
  const params = new URLSearchParams({
    limit: String(options.limit || 12),
    status: 'published',
    sortBy: 'publishedAt',
    sortOrder: 'DESC',
  })

  if (options.category) params.set('category', options.category)
  if (options.tag) params.set('tag', options.tag)
  if (options.author) params.set('author', options.author)
  if (options.search) params.set('search', options.search)
  if (typeof options.featured === 'boolean') params.set('featured', String(options.featured))
  if (typeof options.breaking === 'boolean') params.set('breaking', String(options.breaking))
  if (typeof options.pinned === 'boolean') params.set('pinned', String(options.pinned))

  try {
    const result = await fetchJson<ArticleListResponse>(`/articles?${params.toString()}`)
    return result?.success ? result.data : []
  } catch (error) {
    console.error('Failed to load public articles', error)
    return []
  }
}

export async function getPublicCategories() {
  try {
    const result = await fetchJson<ApiResponse<Category[]>>('/categories?active=true')
    return result?.success ? result.data : []
  } catch (error) {
    console.error('Failed to load public categories', error)
    return []
  }
}

export async function getPublicAuthor(id: string) {
  if (!id) return null

  try {
    const result = await fetchJson<ApiResponse<PublicAuthor>>(`/public/authors/${encodeURIComponent(id)}`)
    return result?.success ? result.data : null
  } catch (error) {
    console.error('Failed to load public author', error)
    return null
  }
}

export async function getPublicArticle(slug: string, options: { trackView?: boolean; revalidate?: number } = {}) {
  const params = new URLSearchParams()
  params.set('trackView', options.trackView === true ? 'true' : 'false')

  const query = params.toString()
  const result = await fetchJson<ApiResponse<PublicArticle>>(
    `/articles/${encodeURIComponent(slug)}${query ? `?${query}` : ''}`,
    { revalidate: options.trackView === true ? 0 : options.revalidate }
  )

  return result?.success ? result.data : null
}

export async function getRelatedArticles(articleId: string, options: { limit?: number } = {}) {
  if (!articleId) return []

  try {
    const result = await fetchJson<RelatedArticlesResponse>(`/articles/${encodeURIComponent(articleId)}/related`)
    const articles = result?.success ? result.data : []
    return typeof options.limit === 'number' ? articles.slice(0, options.limit) : articles
  } catch (error) {
    console.error('Failed to load related articles', error)
    return []
  }
}

export function getArticleUrl(article: Pick<PublicArticle, 'slug'>) {
  return `${resolveSiteUrl()}/article/${article.slug}`
}

export function getAuthorPath(author?: Pick<UserSummary, 'id'> | null) {
  return author?.id ? `/author/${author.id}` : null
}

export function getAuthorUrl(author?: Pick<UserSummary, 'id'> | null) {
  const path = getAuthorPath(author)
  return path ? `${resolveSiteUrl()}${path}` : null
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
