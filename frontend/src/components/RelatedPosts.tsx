import Link from 'next/link'
import {
  getFeaturedImageAlt,
  getFeaturedImageUrl,
  type PublicArticle,
} from '@/lib/publicContent'

interface RelatedPostsProps {
  articles: PublicArticle[]
}

export default function RelatedPosts({ articles }: RelatedPostsProps) {
  if (!articles.length) return null

  return (
    <section className="mt-14 border-t border-gray-200 pt-10" aria-labelledby="related-posts-heading">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 id="related-posts-heading" className="text-2xl font-extrabold tracking-tight text-gray-950 md:text-3xl">
          Related Posts
        </h2>
        <Link href="/blog" className="text-xs font-bold uppercase tracking-widest text-green-700 hover:text-green-900">
          All Stories
        </Link>
      </div>

      <div className="grid gap-4">
        {articles.map((article) => {
          const imageUrl = getFeaturedImageUrl(article.featuredImage)

          return (
            <article key={article.id} className="group">
              <Link
                href={`/article/${article.slug}`}
                className="grid min-h-[92px] grid-cols-[112px_1fr] gap-4 rounded-lg border border-gray-200 bg-white p-3 transition hover:border-green-200 hover:shadow-sm sm:grid-cols-[144px_1fr]"
              >
                <div className="h-20 overflow-hidden rounded-md bg-gray-100 sm:h-24">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={getFeaturedImageAlt(article)}
                      className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center p-3 text-center text-[11px] font-bold text-green-700">
                      PulseToob
                    </div>
                  )}
                </div>

                <div className="min-w-0 py-1">
                  {article.categories?.[0] && (
                    <p className="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-green-700">
                      {article.categories[0].name}
                    </p>
                  )}
                  <h3 className="line-clamp-2 text-sm font-extrabold leading-snug text-gray-950 group-hover:text-green-800 sm:text-base">
                    {article.title}
                  </h3>
                  <p className="mt-2 text-[11px] font-semibold text-gray-400">
                    {article.readTime || 1} min read
                  </p>
                </div>
              </Link>
            </article>
          )
        })}
      </div>
    </section>
  )
}
