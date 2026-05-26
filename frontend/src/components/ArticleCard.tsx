import Link from 'next/link'
import { getImageUrl } from '@/utils/imageUrl'
import { getAuthorName } from '@/utils/author'

interface ArticleCardProps {
  article: {
    id: string
    title: string
    excerpt?: string
    slug: string
    readTime?: number
    createdAt: string
    publishedAt?: string
    views?: number
    seoScore?: number
    author?: { username: string; avatar?: string; firstName?: string; lastName?: string }
    featuredImage?: { url: string; thumbnailUrl?: string; altText?: string }
    categories?: Array<{ name: string; color: string; slug: string }>
  }
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const { title, excerpt, slug, author, featuredImage, readTime, createdAt, publishedAt, categories } = article
  const imageUrl = featuredImage ? getImageUrl(featuredImage.thumbnailUrl || featuredImage.url) : null
  const authorName = getAuthorName(author)

  return (
    <article style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb', transition: 'all 0.2s', cursor: 'pointer' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'none' }}
    >
      <div style={{ height: '200px', background: '#f3f4f6', overflow: 'hidden', position: 'relative' }}>
        {imageUrl ? (
          <img src={imageUrl} alt={featuredImage?.altText || title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', fontSize: '0.875rem', fontWeight: 600, color: '#16a34a' }}>
            PulseToob
          </div>
        )}
        {categories && categories.length > 0 && (
          <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
            <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '600', background: categories[0].color || '#16a34a', color: 'white' }}>
              {categories[0].name}
            </span>
          </div>
        )}
      </div>

      <div style={{ padding: '1.25rem' }}>
        <Link href={`/article/${slug}`} style={{ textDecoration: 'none' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#111827', lineHeight: '1.4', marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {title}
          </h2>
        </Link>

        {excerpt && (
          <p style={{ fontSize: '0.85rem', color: '#6b7280', lineHeight: '1.5', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {excerpt}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#9ca3af' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '600', color: '#16a34a', flexShrink: 0 }}>
            {authorName[0].toUpperCase()}
          </div>
          <span style={{ color: '#374151', fontWeight: '500' }}>{authorName}</span>
          <span>-</span>
          <span>{readTime || 1} min read</span>
          <span>-</span>
          <span>{new Date(publishedAt || createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>
      </div>
    </article>
  )
}
