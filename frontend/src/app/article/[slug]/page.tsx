'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import AdSlot from '@/components/AdSlot'
import { getApiBaseUrl } from '@/utils/apiBase'

const API = getApiBaseUrl()
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

function getImageUrl(featuredImage: any) {
  if (!featuredImage) return null
  if (typeof featuredImage === 'string') return featuredImage
  if (typeof featuredImage === 'object' && featuredImage.url) return featuredImage.url
  return null
}

function getImageAlt(featuredImage: any, fallback: string) {
  if (featuredImage && typeof featuredImage === 'object' && featuredImage.altText) return featuredImage.altText
  return fallback
}

export default function ArticlePage() {
  const params = useParams()
  const [article, setArticle] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params?.slug) {
      fetch(API + '/articles/' + params.slug)
        .then(r => r.json())
        .then(res => { if (res.success) setArticle(res.data) })
        .catch((err) => console.error("Could not fetch article", err))
        .finally(() => setLoading(false))
    }
  }, [params])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 font-medium">
        Loading story...
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <h2 className="text-xl font-bold text-gray-950">Article not found</h2>
        <Link href="/" className="px-4 py-2 bg-gray-950 text-white font-semibold text-sm rounded-lg hover:bg-gray-900 transition">
          Go Home
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#faf9f6]">
      <style dangerouslySetInnerHTML={{ __html: renderStyles }} />

      <div>
        {/* Nav */}
        <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold tracking-tight text-gray-900">
              PulseToob
            </Link>
            <Link href="/blog" className="text-sm font-medium text-gray-600 hover:text-gray-950">
              All Stories
            </Link>
          </div>
        </nav>

        <AdSlot slot="header_leaderboard" adsenseClient={ADSENSE_CLIENT} adsenseSlot={ADSENSE_HEADER_SLOT} />

        {/* Hero Banner Image */}
        {getImageUrl(article.featuredImage) && (
          <figure className="border-b border-gray-100 bg-white">
            <div className="w-full h-[300px] sm:h-[450px] relative overflow-hidden bg-gray-200">
              <img src={getImageUrl(article.featuredImage) || ''} alt={getImageAlt(article.featuredImage, article.title)} className="w-full h-full object-cover" />
            </div>
            {article.featuredImage?.caption && (
              <figcaption className="max-w-3xl mx-auto px-4 py-2 text-xs text-gray-500">
                {article.featuredImage.caption}
              </figcaption>
            )}
          </figure>
        )}

        {/* Content Container */}
        <main className="max-w-3xl mx-auto px-4 py-12">
          {article.categories?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {article.categories.map((cat: any) => (
                <span key={cat.id} className="text-xs font-extrabold uppercase tracking-widest text-green-700">
                  {cat.name}
                </span>
              ))}
            </div>
          )}

          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-950 leading-tight mb-4">
            {article.title}
          </h1>

          {article.subtitle && (
            <h2 className="text-lg md:text-xl text-gray-500 leading-relaxed mb-6 font-medium">
              {article.subtitle}
            </h2>
          )}

          {/* Author */}
          <div className="flex items-center gap-3 border-b border-gray-200 pb-8 mb-8 text-sm text-gray-500">
            <div className="w-10 h-10 rounded-full bg-green-50 text-green-700 border border-green-100 flex items-center justify-center font-bold">
              {article.author?.username?.slice(0, 2).toUpperCase() || 'PT'}
            </div>
            <div>
              <span className="block font-bold text-gray-900 hover:underline cursor-pointer">
                {article.author?.firstName || article.author?.username || 'PulseToob Staff'}
              </span>
              <span className="block text-xs mt-0.5">
                {article.publishedAt && new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                {article.readTime && ` | ${article.readTime} min read`}
              </span>
            </div>
          </div>

          <AdSlot slot="in_article_banner" adsenseClient={ADSENSE_CLIENT} adsenseSlot={ADSENSE_IN_ARTICLE_SLOT} />

          <article 
            className="ProseMirror-rendered max-w-none text-gray-900 leading-relaxed text-base md:text-lg space-y-6"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {article.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-12 border-t border-gray-100 pt-6">
              {article.tags.map((tag: any) => (
                <span key={tag.id} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md text-xs font-semibold cursor-pointer">
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-400 mt-20">
        &copy; {new Date().getFullYear()} PulseToob. All rights reserved.
      </footer>
    </div>
  )
}
