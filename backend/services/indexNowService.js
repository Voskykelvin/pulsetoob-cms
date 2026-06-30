const axios = require('axios');

const DEFAULT_SITE_URL = 'https://www.pulsetoob.com';
const DEFAULT_ENDPOINT = 'https://api.indexnow.org/indexnow';

function getSiteUrl() {
  return (process.env.PUBLIC_SITE_URL || process.env.FRONTEND_URL || process.env.SITE_URL || DEFAULT_SITE_URL)
    .split(',')[0]
    .trim()
    .replace(/\/+$/, '');
}

function getKey() {
  return (process.env.INDEXNOW_KEY || '').trim();
}

function getKeyLocation(siteUrl) {
  return (process.env.INDEXNOW_KEY_LOCATION || `${siteUrl}/indexnow-key.txt`).trim();
}

function getArticleUrl(articleOrSlug) {
  const slug = typeof articleOrSlug === 'string' ? articleOrSlug : articleOrSlug?.slug;
  if (!slug) return null;
  return `${getSiteUrl()}/article/${slug}`;
}

function uniqueUrls(urls) {
  return [...new Set((urls || []).filter(Boolean))];
}

class IndexNowService {
  isEnabled() {
    return Boolean(getKey());
  }

  async submitUrls(urls, reason = 'content_update') {
    const key = getKey();
    if (!key) return { skipped: true, reason: 'missing_key' };

    const urlList = uniqueUrls(urls);
    if (urlList.length === 0) return { skipped: true, reason: 'empty_url_list' };

    const siteUrl = getSiteUrl();
    const { hostname } = new URL(siteUrl);
    const endpoint = (process.env.INDEXNOW_ENDPOINT || DEFAULT_ENDPOINT).trim();

    try {
      const response = await axios.post(
        endpoint,
        {
          host: hostname,
          key,
          keyLocation: getKeyLocation(siteUrl),
          urlList,
        },
        {
          timeout: 5000,
          headers: { 'Content-Type': 'application/json' },
          validateStatus: (status) => status >= 200 && status < 500,
        }
      );

      if (response.status >= 400) {
        console.warn(`IndexNow rejected ${urlList.length} URL(s) for ${reason}: ${response.status}`);
      }

      return { skipped: false, status: response.status, count: urlList.length };
    } catch (error) {
      console.warn(`IndexNow submit failed for ${reason}:`, error.message);
      return { skipped: false, error: error.message, count: urlList.length };
    }
  }

  submitArticle(article, reason) {
    return this.submitUrls([getArticleUrl(article)], reason);
  }

  submitArticles(articles, reason) {
    return this.submitUrls((articles || []).map(getArticleUrl), reason);
  }
}

module.exports = new IndexNowService();
