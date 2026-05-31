import type { MetadataRoute } from 'next'
import {
  getArticleUrl,
  getPublicArticles,
  getSiteUrl,
} from '@/lib/publicContent'

export const revalidate = 300

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const articles = await getPublicArticles({ limit: 100 })

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ]

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: getArticleUrl(article),
    lastModified: article.updatedAt || article.publishedAt || article.createdAt || new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...staticRoutes, ...articleRoutes]
}
