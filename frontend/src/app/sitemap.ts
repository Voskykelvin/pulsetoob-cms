import type { MetadataRoute } from 'next'
import {
  getArticleUrl,
  getFeaturedImageUrl,
  getPublicArticles,
  getPublicCategories,
  getSiteUrl,
} from '@/lib/publicContent'
import { getActiveCategories } from '@/lib/publicCategories'

export const revalidate = 300

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const [articles, categories] = await Promise.all([
    getPublicArticles({ limit: 100 }),
    getPublicCategories(),
  ])
  const allCategories = getActiveCategories(categories)

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
      url: `${siteUrl}/about`,
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

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => {
    const imageUrl = getFeaturedImageUrl(article.featuredImage)

    return {
      url: getArticleUrl(article),
      lastModified: article.updatedAt || article.publishedAt || article.createdAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    }
  })

  const categoryRoutes: MetadataRoute.Sitemap = allCategories.map((category) => ({
    url: `${siteUrl}/category/${category.slug}`,
    lastModified: category.updatedAt || category.createdAt || new Date(),
    changeFrequency: 'daily',
    priority: 0.6,
  }))

  const tagSlugs = new Set<string>()
  articles.forEach((article) => {
    article.tags?.forEach((tag) => tagSlugs.add(tag.slug))
  })

  const tagRoutes: MetadataRoute.Sitemap = Array.from(tagSlugs).map((slug) => ({
    url: `${siteUrl}/tag/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.4,
  }))

  const authorIds = new Set<string>()
  articles.forEach((article) => {
    if (article.author?.id) authorIds.add(article.author.id)
  })

  const authorRoutes: MetadataRoute.Sitemap = Array.from(authorIds).map((id) => ({
    url: `${siteUrl}/author/${id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.4,
  }))

  return [...staticRoutes, ...categoryRoutes, ...tagRoutes, ...authorRoutes, ...articleRoutes]
}
