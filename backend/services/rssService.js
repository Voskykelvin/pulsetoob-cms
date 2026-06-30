const RSS = require('rss');
const { Article, Category, User, Media } = require('../models');
const { getAuthorName } = require('../utils/authorName');

function getSiteUrl() {
  const frontendUrl = process.env.FRONTEND_URL?.split(',')[0]?.trim();
  const siteUrl = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || frontendUrl || 'https://www.pulsetoob.com').replace(/\/+$/, '');

  if (process.env.NODE_ENV === 'production' && /onrender\.com|vercel\.app/i.test(siteUrl)) {
    return 'https://www.pulsetoob.com';
  }

  return siteUrl;
}

async function getCategoryAndDescendantIds(rootCategory) {
  const categories = await Category.findAll({
    where: { isActive: true },
    attributes: ['id', 'parentId'],
  });
  const ids = [rootCategory.id];
  const queue = [rootCategory.id];

  while (queue.length > 0) {
    const parentId = queue.shift();
    const children = categories.filter(category => category.parentId === parentId);
    for (const child of children) {
      if (ids.includes(child.id)) continue;
      ids.push(child.id);
      queue.push(child.id);
    }
  }

  return ids;
}

class RSSService {
  async generateMainFeed() {
    const siteUrl = getSiteUrl();
    const feed = new RSS({
      title: 'PulseToob',
      description: 'Breaking stories, entertainment, lifestyle and trending content',
      site_url: siteUrl,
      feed_url: `${siteUrl}/api/rss/feed`,
      language: 'en',
      pubDate: new Date(),
      ttl: 60,
    });

    const articles = await Article.findAll({
      where: { status: 'published', rssIncluded: true },
      order: [['publishedAt', 'DESC']],
      limit: 50,
      include: [
        { model: User, as: 'author', attributes: ['username', 'firstName', 'lastName'] },
        { model: Media, as: 'featuredImage' },
        { model: Category, as: 'categories' },
      ],
    });

    articles.forEach(article => {
      feed.item({
        title: article.title,
        description: article.excerpt || article.metaDescription || '',
        url: `${siteUrl}/article/${article.slug}`,
        guid: article.id,
        categories: article.categories?.map(c => c.name) || [],
        author: getAuthorName(article.author),
        date: article.publishedAt,
        enclosure: article.featuredImage?.url ? { url: article.featuredImage.url, type: 'image/jpeg' } : undefined,
      });
    });

    return feed.xml({ indent: true });
  }

  async generateCategoryFeed(categorySlug) {
    const category = await Category.findOne({ where: { slug: categorySlug, isActive: true } });
    if (!category) throw new Error('Category not found');
    const siteUrl = getSiteUrl();
    const categoryIds = await getCategoryAndDescendantIds(category);

    const feed = new RSS({
      title: `PulseToob - ${category.name}`,
      description: category.description || `Latest ${category.name} articles`,
      site_url: `${siteUrl}/category/${category.slug}`,
      feed_url: `${siteUrl}/api/rss/category/${category.slug}`,
      language: 'en',
      pubDate: new Date(),
    });

    const articles = await Article.findAll({
      include: [
        { model: Category, as: 'categories', where: { id: categoryIds }, attributes: [] },
        { model: User, as: 'author', attributes: ['username', 'firstName', 'lastName'] },
        { model: Media, as: 'featuredImage' },
      ],
      where: { status: 'published', rssIncluded: true },
      order: [['publishedAt', 'DESC']],
      limit: 30,
    });

    articles.forEach(article => {
      feed.item({
        title: article.title,
        description: article.excerpt || '',
        url: `${siteUrl}/article/${article.slug}`,
        guid: article.id,
        author: getAuthorName(article.author),
        date: article.publishedAt,
      });
    });

    return feed.xml({ indent: true });
  }

  async generateMSNFeed() {
    const siteUrl = getSiteUrl();
    const feed = new RSS({
      title: 'PulseToob - MSN Feed',
      description: 'Curated content from PulseToob for MSN',
      site_url: siteUrl,
      feed_url: `${siteUrl}/api/rss/msn`,
      language: 'en',
      pubDate: new Date(),
    });

    const articles = await Article.findAll({
      where: { status: 'published', msnEligible: true },
      order: [['publishedAt', 'DESC']],
      limit: 100,
      include: [
        { model: User, as: 'author', attributes: ['username', 'firstName', 'lastName'] },
        { model: Media, as: 'featuredImage' },
        { model: Category, as: 'categories' },
      ],
    });

    articles.forEach(article => {
      feed.item({
        title: article.title,
        description: article.excerpt || '',
        url: `${siteUrl}/article/${article.slug}`,
        guid: article.id,
        categories: article.categories?.map(c => c.name) || [],
        author: getAuthorName(article.author),
        date: article.publishedAt,
        enclosure: article.featuredImage?.url ? { url: article.featuredImage.url, type: 'image/jpeg' } : undefined,
      });
    });

    return feed.xml({ indent: true });
  }
}

module.exports = new RSSService();
