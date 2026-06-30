import type { Metadata } from 'next'
import Link from 'next/link'
import JsonLd from '@/components/JsonLd'
import NewsletterSignup from '@/components/NewsletterSignup'
import PublicArticleCard from '@/components/PublicArticleCard'
import {
  getPublicArticles,
  getPublicCategories,
  getSiteUrl,
} from '@/lib/publicContent'
import { getCategoryBySlug, getFooterCategories, getNavigationCategories } from '@/lib/publicCategories'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'All Stories',
  description: 'Browse the latest stories, culture updates, lifestyle coverage, and entertainment posts from PulseToob.',
  alternates: {
    canonical: '/blog',
    types: {
      'application/rss+xml': '/api/rss/feed',
    },
  },
  openGraph: {
    title: 'All Stories | PulseToob',
    description: 'Browse the latest stories, culture updates, lifestyle coverage, and entertainment posts from PulseToob.',
    url: '/blog',
    type: 'website',
  },
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams?: { category?: string }
}) {
  const activeFilter = typeof searchParams?.category === 'string' ? searchParams.category : ''
  const categories = await getPublicCategories()
  const activeCategory = activeFilter ? getCategoryBySlug(categories, activeFilter) : null
  const [articles] = await Promise.all([
    getPublicArticles({ limit: activeCategory?.postsPerPage || 20, category: activeFilter }),
  ])
  const navCategories = getNavigationCategories(categories)
  const footerCategories = getFooterCategories(categories)
  const siteUrl = getSiteUrl()
  const pageUrl = activeCategory ? `${siteUrl}/category/${activeCategory.slug}` : `${siteUrl}/blog`
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: activeCategory ? `${activeCategory.name} Stories` : 'All Stories',
      description: activeCategory?.description || 'Browse the latest stories from PulseToob.',
      url: pageUrl,
      isPartOf: {
        '@type': 'WebSite',
        name: 'PulseToob',
        url: siteUrl,
      },
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: articles.slice(0, 12).map((article, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: `${siteUrl}/article/${article.slug}`,
          name: article.title,
        })),
      },
    },
  ]

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#faf9f6]">
      <JsonLd data={schema} />
      <div>
        <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold tracking-tight text-gray-900">
              PulseToob
            </Link>
            <div className="flex items-center gap-5">
              <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-950">
                Home
              </Link>
              <Link href="/search" className="text-sm font-medium text-gray-600 hover:text-gray-950">
                Search
              </Link>
              <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-gray-950">
                About
              </Link>
              <Link href="/contact" className="text-sm font-medium text-gray-600 hover:text-gray-950">
                Contact
              </Link>
            </div>
          </div>
        </nav>

        <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6 text-center space-y-3">
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-950">
            {activeCategory ? activeCategory.name : 'All Stories'}
          </h1>
          <p className="text-sm md:text-base text-gray-500 max-w-lg mx-auto leading-relaxed">
            {activeCategory?.description || 'Every narrative cataloged here aims to inform, spark discussion, or share another look at current happenings.'}
          </p>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 flex flex-wrap gap-2.5 justify-center">
          <Link
            href="/blog"
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition ${
              !activeFilter
                ? 'bg-green-700 text-white border-transparent shadow-sm'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-900'
            }`}
          >
            All Topics
          </Link>
          {navCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border transition ${
                activeFilter === cat.slug
                  ? 'bg-green-700 text-white border-transparent shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-900'
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {articles.length === 0 ? (
            <div className="text-center text-gray-400 font-medium py-12">No articles found in this category.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <PublicArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}

          <section className="mt-12 rounded-lg border border-green-100 bg-green-50 p-6 text-center">
            <h2 className="text-lg font-extrabold text-green-950">Catch the weekly pulse</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-green-800">Get a compact digest of the strongest PulseToob stories and topic clusters.</p>
            <div className="mt-4">
              <NewsletterSignup source="blog_archive" />
            </div>
          </section>
        </main>
      </div>

      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-400 mt-20">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-4 px-4">
          <span>&copy; {new Date().getFullYear()} PulseToob. All rights reserved.</span>
          <Link href="/about" className="text-gray-500 hover:underline">About</Link>
          <Link href="/privacy" className="text-gray-500 hover:underline">Privacy</Link>
          <Link href="/contact" className="text-gray-500 hover:underline">Contact</Link>
          {footerCategories.slice(0, 6).map((category) => (
            <Link key={category.id} href={`/category/${category.slug}`} className="text-gray-500 hover:underline">
              {category.name}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  )
}
