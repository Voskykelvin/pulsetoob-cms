import type { Metadata } from 'next'
import Link from 'next/link'
import { getAuthorName } from '@/utils/author'
import {
  getFeaturedImageAlt,
  getFeaturedImageUrl,
  getPublicArticles,
  getPublicCategories,
} from '@/lib/publicContent'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'All Stories',
  description: 'Browse the latest stories, culture updates, lifestyle coverage, and entertainment posts from PulseToob.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'All Stories | PulseToob',
    description: 'Browse the latest stories, culture updates, lifestyle coverage, and entertainment posts from PulseToob.',
    url: '/blog',
    type: 'website',
  },
}

const catThemes: Record<string, { text: string; bg: string }> = {
  movies: { text: 'text-purple-700', bg: 'bg-purple-50' },
  lifestyle: { text: 'text-emerald-700', bg: 'bg-emerald-50' },
  tech: { text: 'text-blue-700', bg: 'bg-blue-50' },
  technology: { text: 'text-blue-700', bg: 'bg-blue-50' },
  food: { text: 'text-amber-700', bg: 'bg-amber-50' },
  travel: { text: 'text-teal-700', bg: 'bg-teal-50' },
  entertainment: { text: 'text-purple-700', bg: 'bg-purple-50' },
  sports: { text: 'text-sky-700', bg: 'bg-sky-50' },
  business: { text: 'text-indigo-700', bg: 'bg-indigo-50' },
}

function getCatTheme(name?: string | null) {
  const key = name?.toLowerCase().replace(/[^a-z]/g, '') || 'news'
  return catThemes[key] || { text: 'text-slate-700', bg: 'bg-slate-100' }
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams?: { category?: string }
}) {
  const activeFilter = typeof searchParams?.category === 'string' ? searchParams.category : ''
  const [articles, categories] = await Promise.all([
    getPublicArticles({ limit: 20, category: activeFilter }),
    getPublicCategories(),
  ])

  const activeCategory = categories.find((cat) => cat.slug === activeFilter)

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#faf9f6]">
      <div>
        <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold tracking-tight text-gray-900">
              PulseToob
            </Link>
            <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-950">
              Home
            </Link>
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
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/blog?category=${cat.slug}`}
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
                <article key={article.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm flex flex-col h-full hover:shadow transition duration-150">
                  <div className="h-44 bg-gray-100 relative">
                    {getFeaturedImageUrl(article.featuredImage) ? (
                      <img
                        src={getFeaturedImageUrl(article.featuredImage) || ''}
                        alt={getFeaturedImageAlt(article)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-4 bg-gray-100 text-center text-gray-400 text-xs font-semibold">
                        {article.title}
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col justify-between flex-grow space-y-3">
                    <div className="space-y-2">
                      {article.categories?.[0] && (
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${getCatTheme(article.categories[0].name).bg} ${getCatTheme(article.categories[0].name).text}`}>
                          {article.categories[0].name}
                        </span>
                      )}
                      <h2 className="font-bold text-gray-900 line-clamp-2 hover:underline">
                        <Link href={`/article/${article.slug}`}>{article.title}</Link>
                      </h2>
                      <p className="text-xs text-gray-500 line-clamp-2">{article.excerpt}</p>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400 border-t border-gray-100 pt-3">
                      <span>{getAuthorName(article.author)}</span>
                      <span>{article.readTime || 5} min</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>

      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-400 mt-20">
        &copy; {new Date().getFullYear()} PulseToob. All rights reserved.
      </footer>
    </div>
  )
}
