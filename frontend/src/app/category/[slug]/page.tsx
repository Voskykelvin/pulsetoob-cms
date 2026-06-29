import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import PublicArticleCard from '@/components/PublicArticleCard'
import { getPublicArticles, getPublicCategories, getSiteUrl } from '@/lib/publicContent'

export const revalidate = 60

interface CategoryPageProps {
  params: { slug: string }
}

export async function generateStaticParams() {
  const categories = await getPublicCategories()
  return categories.map((category) => ({ slug: category.slug }))
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const categories = await getPublicCategories()
  const category = categories.find((item) => item.slug === params.slug)
  if (!category) return { title: 'Category' }

  const title = `${category.name} Stories`
  const description = category.description || `Read the latest ${category.name} stories from PulseToob.`

  return {
    title,
    description,
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: {
      title: `${title} | PulseToob`,
      description,
      url: `${getSiteUrl()}/category/${category.slug}`,
      type: 'website',
    },
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const [articles, categories] = await Promise.all([
    getPublicArticles({ limit: 24, category: params.slug }),
    getPublicCategories(),
  ])

  const category = categories.find((item) => item.slug === params.slug)
  if (!category) notFound()

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#faf9f6] text-gray-950">
      <div>
        <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold tracking-tight">
              PulseToob
            </Link>
            <div className="flex items-center gap-5 text-sm font-medium text-gray-600">
              <Link href="/blog" className="hover:text-gray-950">All Stories</Link>
              <Link href="/search" className="hover:text-gray-950">Search</Link>
              <Link href="/contact" className="hover:text-gray-950">Contact</Link>
            </div>
          </div>
        </nav>

        <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6 text-center space-y-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-green-700">Topic</p>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{category.name}</h1>
          <p className="text-sm md:text-base text-gray-500 max-w-xl mx-auto leading-relaxed">
            {category.description || `The latest ${category.name.toLowerCase()} stories from PulseToob.`}
          </p>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 flex flex-wrap gap-2.5 justify-center">
          <Link
            href="/blog"
            className="px-4 py-1.5 rounded-full text-xs font-bold border bg-white text-gray-700 border-gray-200 hover:border-gray-900 transition"
          >
            All Topics
          </Link>
          {categories.map((item) => (
            <Link
              key={item.id}
              href={`/category/${item.slug}`}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border transition ${
                item.slug === params.slug
                  ? 'bg-green-700 text-white border-transparent shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-900'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {articles.length === 0 ? (
            <div className="text-center text-gray-400 font-medium py-12">No stories have been published in this topic yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <PublicArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </main>
      </div>

      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-400 mt-20 space-x-4">
        <span>&copy; {new Date().getFullYear()} PulseToob. All rights reserved.</span>
        <Link href="/privacy" className="text-gray-500 hover:underline">Privacy</Link>
        <Link href="/contact" className="text-gray-500 hover:underline">Contact</Link>
      </footer>
    </div>
  )
}
