const cheerio = require('cheerio');
const { getAuthorName } = require('../utils/authorName');

function getSiteUrl() {
  const frontendUrl = process.env.FRONTEND_URL?.split(',')[0]?.trim();
  return (process.env.SITE_URL || frontendUrl || 'https://www.pulsetoob.com').replace(/\/+$/, '');
}

class SEOService {
  analyzeArticle(article) {
    const analysis = { score: 0, maxScore: 100, checks: [], suggestions: [] };

    const titleCheck = this.analyzeTitle(article.title, article.metaKeywords);
    analysis.checks.push(titleCheck);
    analysis.score += titleCheck.score;

    const metaCheck = this.analyzeMetaDescription(article.metaDescription, article.metaKeywords);
    analysis.checks.push(metaCheck);
    analysis.score += metaCheck.score;

    const contentCheck = this.analyzeContentLength(article.content || '');
    analysis.checks.push(contentCheck);
    analysis.score += contentCheck.score;

    const headingsCheck = this.analyzeHeadings(article.content || '');
    analysis.checks.push(headingsCheck);
    analysis.score += headingsCheck.score;

    const imagesCheck = this.analyzeImages(article.content || '', article.featuredImage);
    analysis.checks.push(imagesCheck);
    analysis.score += imagesCheck.score;

    const slugCheck = this.analyzeSlug(article.slug, article.metaKeywords);
    analysis.checks.push(slugCheck);
    analysis.score += slugCheck.score;

    analysis.suggestions = this.generateSuggestions(analysis.checks);
    return analysis;
  }

  analyzArticle(article) {
    return this.analyzeArticle(article);
  }

  analyzeTitle(title, keywords = []) {
    const check = { name: 'Title', maxScore: 20, score: 0, status: 'poor', details: [] };
    if (!title) {
      check.details.push('Needs work: title is missing');
      return check;
    }

    if (title.length >= 50 && title.length <= 60) {
      check.score += 10;
      check.details.push(`Good: title length (${title.length}) is optimal`);
    } else if (title.length >= 40 && title.length <= 70) {
      check.score += 6;
      check.details.push(`Review: title length (${title.length}) is acceptable`);
    } else {
      check.score += 2;
      check.details.push(`Needs work: title length (${title.length}) should be 50-60 characters`);
    }

    if (keywords && keywords.length > 0) {
      const hasKeyword = keywords.some((keyword) => title.toLowerCase().includes(keyword.toLowerCase()));
      if (hasKeyword) {
        check.score += 10;
        check.details.push('Good: target keyword found in title');
      } else {
        check.details.push('Needs work: no target keyword in title');
      }
    } else {
      check.score += 5;
    }

    check.status = check.score >= 16 ? 'good' : check.score >= 10 ? 'fair' : 'poor';
    return check;
  }

  analyzeMetaDescription(description, keywords = []) {
    const check = { name: 'Meta Description', maxScore: 20, score: 0, status: 'poor', details: [] };
    if (!description) {
      check.details.push('Needs work: meta description is missing');
      return check;
    }

    if (description.length >= 120 && description.length <= 160) {
      check.score += 10;
      check.details.push('Good: meta description length is optimal');
    } else if (description.length >= 100) {
      check.score += 6;
      check.details.push('Review: meta description length is acceptable');
    } else {
      check.score += 2;
      check.details.push('Needs work: meta description is too short');
    }

    if (keywords && keywords.length > 0) {
      const hasKeyword = keywords.some((keyword) => description.toLowerCase().includes(keyword.toLowerCase()));
      if (hasKeyword) {
        check.score += 10;
        check.details.push('Good: target keyword found in meta description');
      } else {
        check.details.push('Needs work: no target keyword in meta description');
      }
    } else {
      check.score += 5;
    }

    check.status = check.score >= 16 ? 'good' : check.score >= 10 ? 'fair' : 'poor';
    return check;
  }

  analyzeContentLength(content) {
    const check = { name: 'Content Length', maxScore: 20, score: 0, status: 'poor', details: [] };
    const text = content.replace(/<[^>]*>/g, '');
    const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length;

    if (wordCount >= 2000) {
      check.score = 20;
      check.details.push(`Good: excellent content length (${wordCount} words)`);
    } else if (wordCount >= 1000) {
      check.score = 16;
      check.details.push(`Good: strong content length (${wordCount} words)`);
    } else if (wordCount >= 500) {
      check.score = 10;
      check.details.push(`Review: content length (${wordCount} words) could be longer`);
    } else {
      check.score = 4;
      check.details.push(`Needs work: content is too short (${wordCount} words)`);
    }

    check.status = check.score >= 16 ? 'good' : check.score >= 10 ? 'fair' : 'poor';
    return check;
  }

  analyzeHeadings(content) {
    const check = { name: 'Headings', maxScore: 15, score: 0, status: 'poor', details: [] };
    const $ = cheerio.load(content);
    const h2Count = $('h2').length;
    const h3Count = $('h3').length;

    if (h2Count >= 2) {
      check.score += 10;
      check.details.push(`Good: H2 headings found (${h2Count})`);
    } else if (h2Count === 1) {
      check.score += 6;
      check.details.push('Review: only one H2 heading found');
    } else {
      check.details.push('Needs work: no H2 headings found');
    }

    if (h3Count >= 1) {
      check.score += 5;
      check.details.push('Good: H3 subheadings are used');
    }

    check.status = check.score >= 12 ? 'good' : check.score >= 7 ? 'fair' : 'poor';
    return check;
  }

  analyzeImages(content, featuredImage) {
    const check = { name: 'Images', maxScore: 15, score: 0, status: 'poor', details: [] };
    const $ = cheerio.load(content);
    const images = $('img');

    if (featuredImage && featuredImage.url) {
      check.score += 5;
      check.details.push('Good: featured image is set');
    } else {
      check.details.push('Needs work: no featured image');
    }

    if (images.length >= 2) {
      check.score += 5;
      check.details.push(`Good: content includes ${images.length} images`);
    } else if (images.length === 1) {
      check.score += 3;
      check.details.push('Review: only one image in content');
    }

    let imagesWithAlt = 0;
    images.each((_, img) => {
      if ($(img).attr('alt')?.trim()) imagesWithAlt++;
    });

    if (images.length > 0 && imagesWithAlt === images.length) {
      check.score += 5;
      check.details.push('Good: all images have alt text');
    } else if (images.length > 0) {
      check.details.push(`Needs work: ${images.length - imagesWithAlt} image(s) missing alt text`);
    }

    check.status = check.score >= 12 ? 'good' : check.score >= 7 ? 'fair' : 'poor';
    return check;
  }

  analyzeSlug(slug, keywords = []) {
    const check = { name: 'URL', maxScore: 10, score: 0, status: 'poor', details: [] };
    if (!slug) {
      check.details.push('Needs work: no URL slug');
      return check;
    }

    if (slug.length <= 60) {
      check.score += 5;
      check.details.push('Good: URL length is concise');
    } else {
      check.score += 2;
      check.details.push('Review: URL is quite long');
    }

    if (keywords && keywords.length > 0) {
      const hasKeyword = keywords.some((keyword) => slug.includes(keyword.toLowerCase().replace(/\s+/g, '-')));
      if (hasKeyword) {
        check.score += 5;
        check.details.push('Good: target keyword appears in URL');
      } else {
        check.details.push('Review: consider adding the target keyword to the URL');
      }
    } else {
      check.score += 3;
    }

    check.status = check.score >= 8 ? 'good' : check.score >= 5 ? 'fair' : 'poor';
    return check;
  }

  generateSuggestions(checks) {
    const suggestions = [];

    checks.forEach((check) => {
      if (check.status === 'poor' || check.status === 'fair') {
        check.details
          .filter((detail) => detail.startsWith('Needs work:') || detail.startsWith('Review:'))
          .forEach((detail) => {
            suggestions.push({
              category: check.name,
              priority: check.status === 'poor' ? 'high' : 'medium',
              suggestion: detail.replace(/^(Needs work:|Review:)\s*/, ''),
            });
          });
      }
    });

    return suggestions.sort((a, b) => (a.priority === 'high' && b.priority !== 'high' ? -1 : 1));
  }

  generateArticleSchema(article, author, category) {
    const siteUrl = getSiteUrl();
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.metaDescription || article.excerpt,
      datePublished: article.publishedAt,
      dateModified: article.updatedAt,
      author: { '@type': 'Person', name: getAuthorName(author) },
      publisher: {
        '@type': 'Organization',
        name: 'PulseToob',
        logo: { '@type': 'ImageObject', url: `${siteUrl}/favicon.svg` },
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${siteUrl}/article/${article.slug}` },
      wordCount: article.wordCount,
      articleSection: category?.name || 'General',
    };
  }
}

module.exports = new SEOService();
