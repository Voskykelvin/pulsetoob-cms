import Link from 'next/link'
import { getAuthorAvatarUrl, getAuthorInitials, getAuthorName } from '@/utils/author'
import PublicImage from '@/components/PublicImage'
import {
  getAuthorPath,
  getFeaturedImageAlt,
  getFeaturedImageUrl,
  type PublicArticle,
} from '@/lib/publicContent'

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

export default function PublicArticleCard({ article }: { article: PublicArticle }) {
  const imageUrl = getFeaturedImageUrl(article.featuredImage)
  const category = article.categories?.[0]
  const categoryTheme = getCatTheme(category?.name)
  const authorPath = getAuthorPath(article.author)
  const authorName = getAuthorName(article.author)
  const authorAvatarUrl = getAuthorAvatarUrl(article.author)

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow">
      <div className="relative h-44 bg-gray-100">
        {imageUrl ? (
          <PublicImage
            src={imageUrl}
            alt={getFeaturedImageAlt(article)}
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100 p-4 text-center text-xs font-semibold text-gray-400">
            {article.title}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between space-y-3 p-5">
        <div className="space-y-2">
          {category && (
            <Link
              href={`/category/${category.slug}`}
              className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${categoryTheme.bg} ${categoryTheme.text}`}
            >
              {category.name}
            </Link>
          )}
          <h2 className="line-clamp-2 font-bold text-gray-900 hover:underline">
            <Link href={`/article/${article.slug}`}>{article.title}</Link>
          </h2>
          <p className="line-clamp-2 text-xs text-gray-500">{article.excerpt}</p>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3 text-[11px] font-semibold text-gray-400">
          <div className="flex min-w-0 items-center gap-2">
            <div className="relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-green-100 bg-green-50 text-[10px] font-extrabold text-green-700">
              {authorAvatarUrl ? (
                <PublicImage
                  src={authorAvatarUrl}
                  alt={`${authorName} profile photo`}
                  sizes="24px"
                  className="h-full w-full object-cover"
                />
              ) : (
                getAuthorInitials(article.author)
              )}
            </div>
            {authorPath ? (
              <Link href={authorPath} className="truncate hover:text-green-700 hover:underline">
                {authorName}
              </Link>
            ) : (
              <span className="truncate">{authorName}</span>
            )}
          </div>
          <span className="shrink-0">{article.readTime || 5} min</span>
        </div>
      </div>
    </article>
  )
}
