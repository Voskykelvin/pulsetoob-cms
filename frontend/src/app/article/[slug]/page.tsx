import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import AdSlot from '@/components/AdSlot'
import ArticleViewTracker from '@/components/ArticleViewTracker'
import { getAuthorInitials, getAuthorName } from '@/utils/author'
import { renderArticleContent } from '@/utils/articleContent'
import {
  getArticleDescription,
  getArticleUrl,
  getFeaturedImageAlt,
  getFeaturedImageUrl,
  getPublicArticle,
  getSiteUrl,
  type PublicArticle,
} from '@/lib/publicContent'

export const revalidate = 60

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
const ADSENSE_HEADER_SLOT = process.env.NEXT_PUBLIC_ADSENSE_HEADER_SLOT
const ADSENSE_IN_ARTICLE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_IN_ARTICLE_SLOT

const renderStyles = `
  .ProseMirror-rendered ul {
    list-style-type: disc !important;
    padding-left: 2rem !important;
    margin-bottom: 1rem;
  }
  .ProseMirror-rendered ol {
    list-style-type: decimal !important;
    padding-left: 2rem !important;
    margin-bottom: 1rem;
  }
  .ProseMirror-rendered li {
    margin-bottom: 0.25rem;
  }
  .ProseMirror-rendered blockquote {
    border-left: 4px solid #16a34a;
    background-color: #f0fdf4;
    padding: 1rem 1.25rem;
    margin: 1.5rem 0;
    font-style: italic;
    color: #166534;
    border-radius: 0 6px 6px 0;
  }
  .ProseMirror-rendered img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 1.5rem auto;
    display: block;
  }
  .ProseMirror-rendered figure.content-image {
    margin: 1.75rem 0;
    text-align: center;
  }
  .ProseMirror-rendered figure.content-image img {
    margin: 0 auto;
  }
  .ProseMirror-rendered figure.content-image figcaption {
    margin-top: 0.5rem;
    color: #6b7280;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 0.75rem;
    line-height: 1.4;
    text-align: center;
  }
  .ProseMirror-rendered pre {
    background: #1e1e2e;
    color: #cdd6f4;
    padding: 1rem;
    border-radius: 8px;
    font-family: monospace;
    font-size: 0.9rem;
    overflow-x: auto;
    margin: 1.5rem 0;
  }
  .ProseMirror-rendered h1 { font-size: 2.25rem; font-weight: 800; margin-top: 1.75rem; margin-bottom: 0.75rem; }
  .ProseMirror-rendered h2 { font-size: 1.8rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.5rem; }
  .ProseMirror-rendered h3 { font-size: 1.5rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.5rem; }
  .ProseMirror-rendered h4 { font-size: 1.25rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.5rem; }
`

function cleanJsonLd(data: Record<string, unknown>) {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

function getArticleSchema(article: PublicArticle) {
  const url = getArticleUrl(article)
  const imageUrl = getFeaturedImageUrl(article.featuredImage)
  const description = getArticleDescription(article)

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    headline: article.title,
    description,
    image: imageUrl ? [imageUrl] : undefined,
    datePublished: article.publishedAt || article.createdAt,
    dateModified: article.updatedAt || article.publishedAt || article.createdAt,
    author: {
      '@type': 'Person',
      name: getAuthorName(article.author, 'PulseToob Staff'),
    },
    publisher: {
      '@type': 'Organization',
      name: 'PulseToob',
      url: getSiteUrl(),
    },
    articleSection: article.categories?.map((category) => category.name),
    keywords: article.metaKeywords?.join(', '),
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const article = await getPublicArticle(params.slug, { trackView: false })

  if (!article) {
    return {
      title: 'Article not found',
      robots: { index: false, follow: false },
    }
  }

  const title = article.metaTitle || article.title
  const description = getArticleDescription(article)
  const url = getArticleUrl(article)
  const imageUrl = getFeaturedImageUrl(article.featuredImage)
  const imageAlt = getFeaturedImageAlt(article)

  return {
    title,
    description,
    alternates: {
      canonical: article.canonicalUrl || url,
    },
    openGraph: {
      title: article.ogTitle || title,
      description: article.ogDescription || description,
      url,
      type: 'article',
      publishedTime: article.publishedAt || undefined,
      modifiedTime: article.updatedAt || undefined,
      authors: [getAuthorName(article.author, 'PulseToob Staff')],
      section: article.categories?.[0]?.name,
      tags: article.tags?.map((tag) => tag.name),
      images: imageUrl ? [{ url: imageUrl, alt: imageAlt }] : undefined,
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title: article.ogTitle || title,
      description: article.ogDescription || description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  }
}

export default async function ArticlePage({
  params,
}: {
  params: { slug: string }
}) {
  const article = await getPublicArticle(params.slug, { trackView: false })

  if (!article) notFound()

  const imageUrl = getFeaturedImageUrl(article.featuredImage)
  const schema = getArticleSchema(article)

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#faf9f6]">
      <style dangerouslySetInnerHTML={{ __html: renderStyles }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: cleanJsonLd(schema) }}
      />
      <ArticleViewTracker articleId={article.id} slug={params.slug} />

      <div>
        <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold tracking-tight text-gray-900">
              PulseToob
            </Link>
            <div className="flex items-center gap-5">
              <Link href="/blog" className="text-sm font-medium text-gray-600 hover:text-gray-950">
                All Stories
              </Link>
              <Link href="/contact" className="text-sm font-medium text-gray-600 hover:text-gray-950">
                Contact
              </Link>
            </div>
          </div>
        </nav>

        <AdSlot slot="header_leaderboard" adsenseClient={ADSENSE_CLIENT} adsenseSlot={ADSENSE_HEADER_SLOT} />

        {imageUrl && (
          <figure className="border-b border-gray-100 bg-white">
            <div className="w-full h-[300px] sm:h-[450px] relative overflow-hidden bg-gray-200">
              <img src={imageUrl} alt={getFeaturedImageAlt(article)} className="w-full h-full object-cover" />
            </div>
            {typeof article.featuredImage === 'object' && article.featuredImage?.caption && (
              <figcaption className="max-w-3xl mx-auto px-4 py-2 text-center text-xs text-gray-500">
                {article.featuredImage.caption}
              </figcaption>
            )}
          </figure>
        )}

        <main className="max-w-3xl mx-auto px-4 py-12">
          {article.categories?.length ? (
            <div className="flex flex-wrap gap-2 mb-4">
              {article.categories.map((cat) => (
                <span key={cat.id} className="text-xs font-extrabold uppercase tracking-widest text-green-700">
                  {cat.name}
                </span>
              ))}
            </div>
          ) : null}

          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-950 leading-tight mb-4">
            {article.title}
          </h1>

          {article.subtitle && (
            <h2 className="text-lg md:text-xl text-gray-500 leading-relaxed mb-6 font-medium">
              {article.subtitle}
            </h2>
          )}

          <div className="flex items-center gap-3 border-b border-gray-200 pb-8 mb-8 text-sm text-gray-500">
            <div className="w-10 h-10 rounded-full bg-green-50 text-green-700 border border-green-100 flex items-center justify-center font-bold">
              {getAuthorInitials(article.author)}
            </div>
            <div>
              <span className="block font-bold text-gray-900">
                {getAuthorName(article.author, 'PulseToob Staff')}
              </span>
              <span className="block text-xs mt-0.5">
                {article.publishedAt && (
                  <time dateTime={article.publishedAt}>
                    {new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </time>
                )}
                {article.readTime && ` | ${article.readTime} min read`}
              </span>
            </div>
          </div>

          <AdSlot slot="in_article_banner" adsenseClient={ADSENSE_CLIENT} adsenseSlot={ADSENSE_IN_ARTICLE_SLOT} />

          <article
            className="ProseMirror-rendered max-w-none text-gray-900 leading-relaxed text-base md:text-lg space-y-6"
            dangerouslySetInnerHTML={{ __html: renderArticleContent(article.content) }}
          />

          {article.tags?.length ? (
            <div className="flex flex-wrap gap-2 mt-12 border-t border-gray-100 pt-6">
              {article.tags.map((tag) => (
                <span key={tag.id} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-semibold">
                  #{tag.name}
                </span>
              ))}
            </div>
          ) : null}
        </main>
      </div>

      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-400 mt-20 space-x-4">
        <span>&copy; {new Date().getFullYear()} PulseToob. All rights reserved.</span>
        <Link href="/contact" className="text-gray-500 hover:underline">Contact</Link>
      </footer>
    </div>
  )
}
