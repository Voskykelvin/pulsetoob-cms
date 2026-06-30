import {
  getArticleUrl,
  getFeaturedImageUrl,
  getPublicArticles,
} from '@/lib/publicContent'

export const revalidate = 300

const NEWS_WINDOW_MS = 48 * 60 * 60 * 1000

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function getPublishedDate(article: Awaited<ReturnType<typeof getPublicArticles>>[number]) {
  const dateValue = article.publishedAt || article.createdAt
  const date = dateValue ? new Date(dateValue) : null
  return date && Number.isFinite(date.getTime()) ? date : null
}

export async function GET() {
  const now = Date.now()
  const articles = (await getPublicArticles({ limit: 100 }))
    .map((article) => ({ article, publishedDate: getPublishedDate(article) }))
    .filter(({ publishedDate }) => publishedDate && now - publishedDate.getTime() <= NEWS_WINDOW_MS)
    .slice(0, 1000)

  const urls = articles.map(({ article, publishedDate }) => {
    const imageUrl = getFeaturedImageUrl(article.featuredImage)

    return `  <url>
    <loc>${escapeXml(getArticleUrl(article))}</loc>
    <news:news>
      <news:publication>
        <news:name>PulseToob</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${publishedDate?.toISOString()}</news:publication_date>
      <news:title>${escapeXml(article.title)}</news:title>
    </news:news>${imageUrl ? `
    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
      <image:title>${escapeXml(article.title)}</image:title>
    </image:image>` : ''}
  </url>`
  })

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
