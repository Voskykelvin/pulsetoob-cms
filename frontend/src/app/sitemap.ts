import type { MetadataRoute } from 'next'
import {
  getArticleUrl,
  getPublicArticles,
  getPublicCategories,
  getSiteUrl,
} from '@/lib/publicContent'

export const revalidate = 300

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const [articles, categories] = await Promise.all([
    getPublicArticles({ limit: 100 }),
    getPublicCategories(),
  ])

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
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: getArticleUrl(article),
    lastModified: article.updatedAt || article.publishedAt || article.createdAt || new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${siteUrl}/category/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.6,
  }))

  return [...staticRoutes, ...categoryRoutes, ...articleRoutes]
}
