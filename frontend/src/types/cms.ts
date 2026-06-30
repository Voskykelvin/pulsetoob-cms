export type ArticleStatus = 'draft' | 'published' | 'scheduled' | 'archived'
export type UserRole = 'super_admin' | 'admin' | 'editor' | 'author' | 'contributor' | 'subscriber'
export type AdSlotName = 'header_leaderboard' | 'sidebar_square' | 'in_article_banner'
export type ArticleTemplate = 'default' | 'full_width' | 'sidebar' | 'magazine' | 'video' | 'gallery'

export interface MediaAsset {
  id: string
  originalName?: string
  mimeType?: string
  type?: 'image' | 'video' | 'audio' | 'document'
  size?: number
  url: string
  thumbnailUrl?: string | null
  thumbnailSmall?: string | null
  thumbnailMedium?: string | null
  thumbnailLarge?: string | null
  altText?: string | null
  caption?: string | null
  title?: string | null
  description?: string | null
  folder?: string | null
  collection?: string | null
  focalPointX?: number
  focalPointY?: number
  needsAltText?: boolean
  tags?: string[]
  usageCount?: number
  optimized?: boolean
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  color?: string | null
  icon?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  metaKeywords?: string[]
  parentId?: string | null
  parent?: Category | null
  subcategories?: Category[]
  order?: number
  isActive?: boolean
  articleCount?: number
  showInNav?: boolean
  showInFooter?: boolean
  showInSidebar?: boolean
  rssEnabled?: boolean
  msnEnabled?: boolean
  isFeatured?: boolean
  layout?: 'grid' | 'list' | 'magazine' | 'masonry'
  postsPerPage?: number
  createdAt?: string
  updatedAt?: string
}

export interface UserSummary {
  id: string
  username: string
  firstName?: string | null
  lastName?: string | null
  avatar?: string | null
}

export interface Tag {
  id: string
  name: string
  slug: string
  articleCount?: number
  color?: string | null
}

export interface CmsUser extends UserSummary {
  email: string
  role: UserRole
  isActive: boolean
  isVerified: boolean
  createdAt: string
  lastLogin?: string | null
}

export interface Article {
  id: string
  title: string
  slug: string
  content?: string | null
  excerpt?: string | null
  subtitle?: string | null
  status: ArticleStatus
  views?: number
  createdAt: string
  updatedAt?: string
  publishedAt?: string | null
  scheduledFor?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  metaKeywords?: string[]
  canonicalUrl?: string | null
  ogTitle?: string | null
  ogDescription?: string | null
  ogImage?: string | null
  isFeatured?: boolean
  isPinned?: boolean
  isBreaking?: boolean
  rssIncluded?: boolean
  msnEligible?: boolean
  template?: ArticleTemplate
  section?: string | null
  author?: UserSummary
  categories?: Category[]
  tags?: Tag[]
  featuredImage?: MediaAsset | null
}

export interface NewsletterSubscriber {
  id: string
  email: string
  source?: string | null
  status: 'active' | 'unsubscribed'
  createdAt: string
  updatedAt: string
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  topic: 'collaboration' | 'advertising' | 'correction' | 'story_tip' | 'general'
  subject: string
  message: string
  consent: boolean
  status: 'new' | 'reviewed' | 'archived'
  createdAt: string
  updatedAt: string
}

export interface Pagination {
  total: number
  page: number
  limit: number
  pages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  pagination?: Pagination
}

export interface Advertisement {
  id: string
  title: string
  imageUrl: string
  targetUrl: string
  slot: AdSlotName
  sponsorName?: string | null
  impressions: number
  clicks: number
  isActive: boolean
  startDate?: string | null
  endDate?: string | null
  createdAt: string
  updatedAt: string
}
