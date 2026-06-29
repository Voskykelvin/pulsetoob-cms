import Link from 'next/link'
import { getAuthorName } from '@/utils/author'
import {
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

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow">
      <div className="relative h-44 bg-gray-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={getFeaturedImageAlt(article)}
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
        <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-[11px] font-semibold text-gray-400">
          <span>{getAuthorName(article.author)}</span>
          <span>{article.readTime || 5} min</span>
        </div>
      </div>
    </article>
  )
}
