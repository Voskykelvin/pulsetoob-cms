import type { Metadata } from 'next'
import Link from 'next/link'
import AdSlot from '@/components/AdSlot'
import { getAuthorName } from '@/utils/author'
import {
  getFeaturedImageAlt,
  getFeaturedImageUrl,
  getPublicArticles,
  getPublicCategories,
} from '@/lib/publicContent'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: { absolute: 'PulseToob' },
  description: 'Breaking stories, entertainment, lifestyle and trending content from PulseToob.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'PulseToob',
    description: 'Breaking stories, entertainment, lifestyle and trending content from PulseToob.',
    url: '/',
    type: 'website',
  },
}

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
const ADSENSE_HEADER_SLOT = process.env.NEXT_PUBLIC_ADSENSE_HEADER_SLOT
const ADSENSE_IN_ARTICLE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_IN_ARTICLE_SLOT

const catThemes: Record<string, { text: string; bg: string }> = {
  movies: { text: 'text-purple-700', bg: 'bg-purple-50' },
  lifestyle: { text: 'text-emerald-700', bg: 'bg-emerald-50' },
  tech: { text: 'text-blue-700', bg: 'bg-blue-50' },
  technology: { text: 'text-blue-700', bg: 'bg-blue-50' },
  food: { text: 'text-amber-700', bg: 'bg-amber-50' },
  travel: { text: 'text-teal-700', bg: 'bg-teal-50' },
  music: { text: 'text-pink-700', bg: 'bg-pink-50' },
  health: { text: 'text-green-700', bg: 'bg-green-50' },
  entertainment: { text: 'text-purple-700', bg: 'bg-purple-50' },
  sports: { text: 'text-sky-700', bg: 'bg-sky-50' },
  business: { text: 'text-indigo-700', bg: 'bg-indigo-50' },
  news: { text: 'text-red-700', bg: 'bg-red-50' },
}

function getCatTheme(name?: string | null) {
  const key = name?.toLowerCase().replace(/[^a-z]/g, '') || 'news'
  return catThemes[key] || { text: 'text-slate-700', bg: 'bg-slate-100' }
}

export default async function HomePage() {
  const [articles, categories] = await Promise.all([
    getPublicArticles({ limit: 12 }),
    getPublicCategories(),
  ])

  const hero = articles[0]
  const trending = articles.slice(1, 5)
  const rest = articles.slice(5)

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
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

        {categories.length > 0 && (
          <div className="bg-white border-b border-gray-100 overflow-x-auto whitespace-nowrap py-3">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-3">
              <Link href="/blog" className="px-4 py-1.5 bg-gray-900 text-white rounded-full text-xs font-semibold">
                All
              </Link>
              {categories.slice(0, 8).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/blog?category=${cat.slug}`}
                  className="px-4 py-1.5 border border-gray-200 text-gray-700 hover:border-gray-900 hover:text-gray-950 rounded-full text-xs font-semibold transition"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        <AdSlot slot="header_leaderboard" adsenseClient={ADSENSE_CLIENT} adsenseSlot={ADSENSE_HEADER_SLOT} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {articles.length === 0 ? (
            <div className="text-center py-20 max-w-md mx-auto">
              <h1 className="text-2xl font-extrabold text-gray-900">PulseToob</h1>
              <p className="text-gray-500 text-sm mt-2">
                Fresh stories are being prepared. Check back soon for the latest culture, lifestyle, and entertainment updates.
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {hero && (
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-gray-200 pb-12">
                  <div className="lg:col-span-7 rounded-2xl overflow-hidden h-[300px] sm:h-[450px] bg-gray-100 border border-gray-200 shadow-sm">
                    {getFeaturedImageUrl(hero.featuredImage) ? (
                      <img
                        src={getFeaturedImageUrl(hero.featuredImage) || ''}
                        alt={getFeaturedImageAlt(hero)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
                        <span className="font-semibold text-lg text-center px-6">{hero.title}</span>
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-5 flex flex-col justify-center space-y-4">
                    {hero.categories?.[0] && (
                      <span className={`self-start px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${getCatTheme(hero.categories[0].name).bg} ${getCatTheme(hero.categories[0].name).text}`}>
                        {hero.categories[0].name}
                      </span>
                    )}
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
                      <Link href={`/article/${hero.slug}`} className="hover:underline hover:text-green-800">
                        {hero.title}
                      </Link>
                    </h1>
                    <p className="text-gray-600 leading-relaxed text-sm sm:text-base line-clamp-3">
                      {hero.excerpt || 'Read the full story to discover more details about this newly published narrative.'}
                    </p>
                    <div className="flex items-center gap-3 text-xs font-semibold text-gray-500">
                      <span className="text-gray-800">{getAuthorName(hero.author)}</span>
                      <span>|</span>
                      <span>{hero.readTime || 5} min read</span>
                      {hero.publishedAt && (
                        <>
                          <span>|</span>
                          <time dateTime={hero.publishedAt}>
                            {new Date(hero.publishedAt).toLocaleDateString('en', { month: 'short', year: 'numeric' })}
                          </time>
                        </>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {trending.length > 0 && (
                <section className="space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider">Trending Now</h2>
                    <Link href="/blog" className="text-xs font-bold text-green-700 hover:text-green-800">See all &rarr;</Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {trending.map((article) => (
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
                            <h3 className="font-bold text-gray-900 line-clamp-2 hover:underline">
                              <Link href={`/article/${article.slug}`}>{article.title}</Link>
                            </h3>
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
                </section>
              )}

              <AdSlot slot="in_article_banner" adsenseClient={ADSENSE_CLIENT} adsenseSlot={ADSENSE_IN_ARTICLE_SLOT} />

              {categories.length > 0 && (
                <section className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-6">Browse By Topic</h2>
                  <div className="flex flex-wrap gap-3">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/blog?category=${cat.slug}`}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition hover:shadow-sm ${getCatTheme(cat.name).bg} ${getCatTheme(cat.name).text}`}
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {rest.length > 0 && (
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rest.map((article) => (
                    <article key={article.id} className="flex gap-4 p-4 rounded-xl border border-gray-200 bg-white shadow-sm items-center hover:shadow transition duration-150">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {getFeaturedImageUrl(article.featuredImage) ? (
                          <img
                            src={getFeaturedImageUrl(article.featuredImage) || ''}
                            alt={getFeaturedImageAlt(article)}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-200" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-sm text-gray-900 line-clamp-2 hover:underline">
                          <Link href={`/article/${article.slug}`}>{article.title}</Link>
                        </h3>
                        <p className="text-[11px] text-gray-400 font-semibold">{article.readTime || 5} min read</p>
                      </div>
                    </article>
                  ))}
                </section>
              )}

              <section className="bg-green-50 rounded-2xl p-8 sm:p-12 text-center border border-green-100 max-w-4xl mx-auto space-y-4 shadow-sm">
                <h2 className="text-2xl font-extrabold text-green-950">Get the pulse. Weekly.</h2>
                <p className="text-green-800 text-sm max-w-md mx-auto font-medium">The best stories from PulseToob, curated and delivered every Sunday morning.</p>
                <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-2">
                  <input type="email" placeholder="Your email address" className="w-full px-4 py-3 text-sm rounded-lg border border-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-black shadow-inner" />
                  <button type="button" className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold shadow transition-all whitespace-nowrap">
                    Subscribe Free
                  </button>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <span className="text-lg font-bold text-gray-900">PulseToob</span>
            <p className="text-xs text-gray-500">Life. Culture. Everything in between.</p>
          </div>
          <div className="flex flex-col gap-2 text-xs text-gray-600">
            <span className="font-semibold text-gray-900">Explore</span>
            <Link href="/" className="hover:underline">Home</Link>
            <Link href="/blog" className="hover:underline">All Stories</Link>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-gray-100 py-6 flex flex-col sm:flex-row justify-between text-xs text-gray-400">
          <span>&copy; {new Date().getFullYear()} PulseToob. All rights reserved.</span>
          <span className="font-semibold text-gray-500">pulsetoob.com</span>
        </div>
      </footer>
    </div>
  )
}
