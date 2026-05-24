const RSS = require('rss');
const { Article, Category, User, Media } = require('../models');

class RSSService {
  async generateMainFeed() {
    const feed = new RSS({
      title: 'PulseToob',
      description: 'Breaking stories, entertainment, lifestyle and trending content',
      site_url: process.env.SITE_URL,
      feed_url: `${process.env.SITE_URL}/api/rss/feed`,
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
        url: `${process.env.SITE_URL}/article/${article.slug}`,
        guid: article.id,
        categories: article.categories?.map(c => c.name) || [],
        author: article.author?.username || 'PulseToob',
        date: article.publishedAt,
        enclosure: article.featuredImage?.url ? { url: article.featuredImage.url, type: 'image/jpeg' } : undefined,
      });
    });

    return feed.xml({ indent: true });
  }

  async generateCategoryFeed(categorySlug) {
    const category = await Category.findOne({ where: { slug: categorySlug } });
    if (!category) throw new Error('Category not found');

    const feed = new RSS({
      title: `PulseToob - ${category.name}`,
      description: category.description || `Latest ${category.name} articles`,
      site_url: `${process.env.SITE_URL}/${category.slug}`,
      feed_url: `${process.env.SITE_URL}/api/rss/category/${category.slug}`,
      language: 'en',
      pubDate: new Date(),
    });

    const articles = await Article.findAll({
      include: [
        { model: Category, as: 'categories', where: { id: category.id }, attributes: [] },
        { model: User, as: 'author', attributes: ['username'] },
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
        url: `${process.env.SITE_URL}/article/${article.slug}`,
        guid: article.id,
        author: article.author?.username || 'PulseToob',
        date: article.publishedAt,
      });
    });

    return feed.xml({ indent: true });
  }

  async generateMSNFeed() {
    const feed = new RSS({
      title: 'PulseToob - MSN Feed',
      description: 'Curated content from PulseToob for MSN',
      site_url: process.env.SITE_URL,
      feed_url: `${process.env.SITE_URL}/api/rss/msn`,
      language: 'en',
      pubDate: new Date(),
    });

    const articles = await Article.findAll({
      where: { status: 'published', msnEligible: true },
      order: [['publishedAt', 'DESC']],
      limit: 100,
      include: [
        { model: User, as: 'author', attributes: ['username'] },
        { model: Media, as: 'featuredImage' },
        { model: Category, as: 'categories' },
      ],
    });

    articles.forEach(article => {
      feed.item({
        title: article.title,
        description: article.excerpt || '',
        url: `${process.env.SITE_URL}/article/${article.slug}`,
        guid: article.id,
        categories: article.categories?.map(c => c.name) || [],
        author: article.author?.username || 'PulseToob',
        date: article.publishedAt,
        enclosure: article.featuredImage?.url ? { url: article.featuredImage.url, type: 'image/jpeg' } : undefined,
      });
    });

    return feed.xml({ indent: true });
  }
}

module.exports = new RSSService();