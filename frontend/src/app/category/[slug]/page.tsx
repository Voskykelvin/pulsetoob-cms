import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import JsonLd from '@/components/JsonLd'
import NewsletterSignup from '@/components/NewsletterSignup'
import PublicArticleCard from '@/components/PublicArticleCard'
import { getPublicArticles, getPublicCategories, getSiteUrl, type PublicArticle } from '@/lib/publicContent'
import {
  getActiveCategories,
  getCategoryBySlug,
  getCategoryChildren,
  getCategoryPath,
  getFooterCategories,
  getNavigationCategories,
  getSidebarCategories,
} from '@/lib/publicCategories'
import type { Category } from '@/types/cms'

export const revalidate = 60

interface CategoryPageProps {
  params: { slug: string }
}

export async function generateStaticParams() {
  const categories = await getPublicCategories()
  return getActiveCategories(categories).map((category) => ({ slug: category.slug }))
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const categories = await getPublicCategories()
  const category = getCategoryBySlug(categories, params.slug)
  if (!category) return { title: 'Category' }

  const title = category.metaTitle || `${category.name} Stories`
  const description = category.metaDescription || category.description || `Read the latest ${category.name} stories from PulseToob.`
  const url = `${getSiteUrl()}/category/${category.slug}`

  return {
    title,
    description,
    keywords: category.metaKeywords,
    alternates: {
      canonical: `/category/${category.slug}`,
      types: {
        'application/rss+xml': `${getSiteUrl()}/api/rss/category/${category.slug}`,
      },
    },
    openGraph: {
      title: `${title} | PulseToob`,
      description,
      url,
      type: 'website',
    },
  }
}

function getGridClass(layout?: Category['layout']) {
  if (layout === 'list') return 'grid grid-cols-1 gap-5'
  if (layout === 'magazine') return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
  return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
}

function ArticleListing({ articles, layout }: { articles: PublicArticle[]; layout?: Category['layout'] }) {
  if (layout === 'masonry') {
    return (
      <div className="columns-1 gap-6 md:columns-2 lg:columns-3">
        {articles.map((article) => (
          <div key={article.id} className="mb-6 break-inside-avoid">
            <PublicArticleCard article={article} />
          </div>
        ))}
      </div>
    )
  }

  if (layout === 'magazine') {
    const [lead, ...rest] = articles
    return (
      <div className={getGridClass(layout)}>
        {lead && (
          <div className="md:col-span-2">
            <PublicArticleCard article={lead} />
          </div>
        )}
        {rest.map((article) => (
          <PublicArticleCard key={article.id} article={article} />
        ))}
      </div>
    )
  }

  return (
    <div className={getGridClass(layout)}>
      {articles.map((article) => (
        <PublicArticleCard key={article.id} article={article} />
      ))}
    </div>
  )
}

function getCategorySchema(category: Category, categories: Category[], articles: PublicArticle[]) {
  const siteUrl = getSiteUrl()
  const url = `${siteUrl}/category/${category.slug}`
  const path = getCategoryPath(categories, category)

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: category.name,
      description: category.metaDescription || category.description || `The latest ${category.name} stories from PulseToob.`,
      url,
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
        ...path.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 2,
          name: item.name,
          item: `${siteUrl}/category/${item.slug}`,
        })),
      ],
    },
  ]
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const categories = await getPublicCategories()
  const category = getCategoryBySlug(categories, params.slug)
  if (!category) notFound()

  const articles = await getPublicArticles({ limit: category.postsPerPage || 24, category: params.slug })
  const navCategories = getNavigationCategories(categories)
  const sidebarCategories = getSidebarCategories(categories).filter((item) => item.id !== category.id)
  const footerCategories = getFooterCategories(categories)
  const childCategories = getCategoryChildren(categories, category.id)
  const categoryPath = getCategoryPath(categories, category)
  const schema = getCategorySchema(category, categories, articles)

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
              <Link href="/about" className="hover:text-gray-950">About</Link>
              <Link href="/contact" className="hover:text-gray-950">Contact</Link>
            </div>
          </div>
        </nav>

        <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6 text-center space-y-3">
          {categoryPath.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2 text-xs font-bold text-gray-400">
              <Link href="/" className="hover:text-gray-700">Home</Link>
              {categoryPath.map((item) => (
                <span key={item.id} className="flex items-center gap-2">
                  <span>/</span>
                  <Link href={`/category/${item.slug}`} className={item.id === category.id ? 'text-green-700' : 'hover:text-gray-700'}>
                    {item.name}
                  </Link>
                </span>
              ))}
            </div>
          )}
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-green-700">Topic</p>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{category.name}</h1>
          <p className="text-sm md:text-base text-gray-500 max-w-xl mx-auto leading-relaxed">
            {category.description || `The latest ${category.name.toLowerCase()} stories from PulseToob.`}
          </p>
        </header>

        {childCategories.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 flex flex-wrap gap-2.5 justify-center">
            {childCategories.map((item) => (
              <Link
                key={item.id}
                href={`/category/${item.slug}`}
                className="px-4 py-1.5 rounded-full text-xs font-bold border bg-white text-green-700 border-green-200 hover:border-green-700 transition"
              >
                {item.name}
              </Link>
            ))}
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 flex flex-wrap gap-2.5 justify-center">
          <Link
            href="/blog"
            className="px-4 py-1.5 rounded-full text-xs font-bold border bg-white text-gray-700 border-gray-200 hover:border-gray-900 transition"
          >
            All Topics
          </Link>
          {navCategories.map((item) => (
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

        <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 ${sidebarCategories.length > 0 ? 'grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start' : ''}`}>
          {articles.length === 0 ? (
            <div className="text-center text-gray-400 font-medium py-12">No stories have been published in this topic yet.</div>
          ) : (
            <ArticleListing articles={articles} layout={category.layout} />
          )}

          {sidebarCategories.length > 0 && (
            <aside className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="text-xs font-extrabold uppercase tracking-[0.18em] text-gray-500">More Topics</h2>
              <div className="mt-4 flex flex-col gap-2">
                {sidebarCategories.slice(0, 10).map((item) => (
                  <Link key={item.id} href={`/category/${item.slug}`} className="rounded-md px-3 py-2 text-sm font-bold text-gray-700 hover:bg-green-50 hover:text-green-800">
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="mt-6 rounded-lg border border-green-100 bg-green-50 p-4">
                <h2 className="text-sm font-extrabold text-green-950">Follow this pulse</h2>
                <p className="mt-1 text-xs leading-relaxed text-green-800">Get the strongest PulseToob stories in your inbox.</p>
                <div className="mt-3">
                  <NewsletterSignup compact source={`category_${category.slug}`} />
                </div>
              </div>
            </aside>
          )}
        </main>
      </div>

      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-400 mt-20">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-4 px-4">
          <span>&copy; {new Date().getFullYear()} PulseToob. All rights reserved.</span>
          <Link href="/about" className="text-gray-500 hover:underline">About</Link>
          <Link href="/privacy" className="text-gray-500 hover:underline">Privacy</Link>
          <Link href="/contact" className="text-gray-500 hover:underline">Contact</Link>
          {footerCategories.slice(0, 6).map((item) => (
            <Link key={item.id} href={`/category/${item.slug}`} className="text-gray-500 hover:underline">
              {item.name}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  )
}
