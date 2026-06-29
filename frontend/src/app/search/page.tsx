import type { Metadata } from 'next'
import Link from 'next/link'
import PublicArticleCard from '@/components/PublicArticleCard'
import { getPublicArticles } from '@/lib/publicContent'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search PulseToob stories by title, excerpt, and article text.',
  alternates: { canonical: '/search' },
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: { q?: string }
}) {
  const query = typeof searchParams?.q === 'string' ? searchParams.q.trim() : ''
  const articles = query ? await getPublicArticles({ limit: 24, search: query }) : []

  return (
    <div className="min-h-screen bg-[#faf9f6] text-gray-950">
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            PulseToob
          </Link>
          <div className="flex items-center gap-5 text-sm font-medium text-gray-600">
            <Link href="/blog" className="hover:text-gray-950">All Stories</Link>
            <Link href="/contact" className="hover:text-gray-950">Contact</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">Search PulseToob</h1>
          <p className="mt-3 text-sm md:text-base text-gray-500">
            Find stories across entertainment, lifestyle, culture, tech, and current happenings.
          </p>
          <form action="/search" className="mt-7 flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search stories..."
              className="min-h-11 flex-1 rounded-lg border border-gray-200 bg-white px-4 text-sm outline-none focus:border-green-600"
            />
            <button type="submit" className="rounded-lg bg-green-700 px-5 py-3 text-sm font-bold text-white hover:bg-green-800">
              Search
            </button>
          </form>
        </header>

        <section className="mt-12">
          {!query ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
              Enter a topic, name, or phrase to search the PulseToob archive.
            </div>
          ) : articles.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
              No stories matched "{query}". Try a broader phrase.
            </div>
          ) : (
            <>
              <p className="mb-5 text-sm font-semibold text-gray-500">
                {articles.length} result{articles.length === 1 ? '' : 's'} for "{query}"
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article) => (
                  <PublicArticleCard key={article.id} article={article} />
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  )
}
