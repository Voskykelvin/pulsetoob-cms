import type { Metadata } from 'next'
import Link from 'next/link'
import JsonLd from '@/components/JsonLd'
import PublicArticleCard from '@/components/PublicArticleCard'
import { getPublicArticles, getSiteUrl } from '@/lib/publicContent'

export const revalidate = 60

interface TagPageProps {
  params: { slug: string }
}

function getTagNameFromArticles(slug: string, articles: Awaited<ReturnType<typeof getPublicArticles>>) {
  return articles
    .flatMap((article) => article.tags || [])
    .find((tag) => tag.slug === slug)?.name || slug.replace(/-/g, ' ')
}

export async function generateStaticParams() {
  const articles = await getPublicArticles({ limit: 100 })
  const slugs = new Set<string>()

  articles.forEach((article) => {
    article.tags?.forEach((tag) => slugs.add(tag.slug))
  })

  return Array.from(slugs).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const articles = await getPublicArticles({ limit: 6, tag: params.slug })
  const tagName = getTagNameFromArticles(params.slug, articles)
  const title = `${tagName} Stories`
  const description = `Read the latest PulseToob stories tagged ${tagName}.`

  return {
    title,
    description,
    alternates: { canonical: `/tag/${params.slug}` },
    openGraph: {
      title: `${title} | PulseToob`,
      description,
      url: `${getSiteUrl()}/tag/${params.slug}`,
      type: 'website',
    },
  }
}

export default async function TagPage({ params }: TagPageProps) {
  const articles = await getPublicArticles({ limit: 24, tag: params.slug })
  const tagName = getTagNameFromArticles(params.slug, articles)
  const siteUrl = getSiteUrl()
  const tagUrl = `${siteUrl}/tag/${params.slug}`
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${tagName} Stories`,
      description: `Read the latest PulseToob stories tagged ${tagName}.`,
      url: tagUrl,
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
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: tagName, item: tagUrl },
      ],
    },
  ]

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#faf9f6] text-gray-950">
      <JsonLd data={schema} />
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

        <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 text-center space-y-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-green-700">Tag</p>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight capitalize">{tagName}</h1>
          <p className="text-sm md:text-base text-gray-500 max-w-xl mx-auto leading-relaxed">
            Story clusters help readers follow a theme across PulseToob.
          </p>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {articles.length === 0 ? (
            <div className="text-center text-gray-400 font-medium py-12">No published stories use this tag yet.</div>
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
