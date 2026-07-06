import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import JsonLd from '@/components/JsonLd'
import NewsletterSignup from '@/components/NewsletterSignup'
import PublicArticleCard from '@/components/PublicArticleCard'
import PublicImage from '@/components/PublicImage'
import { getAuthorAvatarUrl, getAuthorInitials, getAuthorName } from '@/utils/author'
import {
  getAuthorUrl,
  getPublicAuthor,
  getPublicArticles,
  getSiteUrl,
  type PublicArticle,
} from '@/lib/publicContent'
import type { UserSummary } from '@/types/cms'

export const revalidate = 60

interface AuthorPageProps {
  params: { id: string }
}

async function getAuthorArticles(authorId: string) {
  return getPublicArticles({ limit: 50, author: authorId })
}

function getAuthorFromArticles(articles: PublicArticle[], authorId: string): UserSummary | null {
  return articles.find((article) => article.author?.id === authorId)?.author || null
}

function getSocialEntries(author?: UserSummary | null) {
  return Object.entries(author?.socialLinks || {})
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].trim().length > 0)
    .map(([label, url]) => ({ label, url }))
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const [authorProfile, articles] = await Promise.all([
    getPublicAuthor(params.id),
    getAuthorArticles(params.id),
  ])
  const author = authorProfile || getAuthorFromArticles(articles, params.id)

  if (!author) {
    return {
      title: 'Author',
      robots: { index: false, follow: false },
    }
  }

  const authorName = getAuthorName(author, 'PulseToob Staff')
  const description = author.bio || `Read the latest PulseToob stories by ${authorName}.`
  const avatarUrl = getAuthorAvatarUrl(author)

  return {
    title: `${authorName} Stories`,
    description,
    alternates: { canonical: `/author/${params.id}` },
    openGraph: {
      title: `${authorName} | PulseToob`,
      description,
      url: getAuthorUrl(author) || `/author/${params.id}`,
      type: 'profile',
      images: avatarUrl ? [{ url: avatarUrl, alt: authorName }] : undefined,
    },
  }
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const [authorProfile, articles] = await Promise.all([
    getPublicAuthor(params.id),
    getAuthorArticles(params.id),
  ])
  const author = authorProfile || getAuthorFromArticles(articles, params.id)

  if (!author) notFound()

  const siteUrl = getSiteUrl()
  const authorName = getAuthorName(author, 'PulseToob Staff')
  const authorUrl = getAuthorUrl(author) || `${siteUrl}/author/${params.id}`
  const avatarUrl = getAuthorAvatarUrl(author)
  const socialLinks = getSocialEntries(author)
  const publishedCount = author.publishedArticleCount ?? articles.length
  const latestDate = author.latestArticleAt
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      name: `${authorName} | PulseToob`,
      url: authorUrl,
      mainEntity: {
        '@type': 'Person',
        name: authorName,
        url: authorUrl,
        description: author.bio || undefined,
        image: avatarUrl || undefined,
        sameAs: socialLinks.map((item) => item.url),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${authorName} Stories`,
      url: authorUrl,
      isPartOf: {
        '@type': 'WebSite',
        name: 'PulseToob',
        url: siteUrl,
      },
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: articles.slice(0, 20).map((article, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: `${siteUrl}/article/${article.slug}`,
          name: article.title,
        })),
      },
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
              <Link href="/about" className="hover:text-gray-950">About</Link>
              <Link href="/contact" className="hover:text-gray-950">Contact</Link>
            </div>
          </div>
        </nav>

        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <header className="mx-auto max-w-3xl text-center">
            <div className="relative mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-green-100 bg-green-50 text-2xl font-extrabold text-green-700">
              {avatarUrl ? (
                <PublicImage
                  src={avatarUrl}
                  alt={`${authorName} profile photo`}
                  sizes="96px"
                  className="h-full w-full object-cover"
                />
              ) : (
                getAuthorInitials(author, 'PT')
              )}
            </div>
            <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.18em] text-green-700">Author</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">{authorName}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-gray-600">
              {author.bio || `Stories, reporting, and editorial updates from ${authorName} on PulseToob.`}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs font-bold uppercase tracking-wide text-gray-500">
              <span>{publishedCount} published {publishedCount === 1 ? 'story' : 'stories'}</span>
              {latestDate && (
                <span>
                  Latest {new Date(latestDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>
            {socialLinks.length > 0 && (
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {socialLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-bold capitalize text-gray-600 hover:border-green-200 hover:text-green-700"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            )}
          </header>

          <section className="mt-12">
            <div className="mb-5 flex items-center justify-between border-b border-gray-200 pb-3">
              <h2 className="text-sm font-extrabold uppercase tracking-[0.18em] text-gray-700">Latest Stories</h2>
              <span className="text-xs font-semibold text-gray-400">{articles.length} published</span>
            </div>
            {articles.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => (
                  <PublicArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
                No published stories yet.
              </div>
            )}
          </section>

          <section className="mx-auto mt-12 max-w-3xl rounded-lg border border-green-100 bg-green-50 p-6 text-center">
            <h2 className="text-lg font-extrabold text-green-950">Follow the publication</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-green-800">
              Get a compact weekly digest of the strongest PulseToob stories.
            </p>
            <div className="mt-4">
              <NewsletterSignup source={`author_${params.id}`} />
            </div>
          </section>
        </main>
      </div>

      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-400 mt-20 space-x-4">
        <span>&copy; {new Date().getFullYear()} PulseToob. All rights reserved.</span>
        <Link href="/about" className="text-gray-500 hover:underline">About</Link>
        <Link href="/privacy" className="text-gray-500 hover:underline">Privacy</Link>
        <Link href="/contact" className="text-gray-500 hover:underline">Contact</Link>
      </footer>
    </div>
  )
}
