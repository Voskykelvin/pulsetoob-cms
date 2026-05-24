const { Article, Category } = require('../models');
const seoService = require('../services/seoService');

class SEOController {
  async analyzeArticle(req, res) {
    try {
      const article = await Article.findByPk(req.params.id);
      if (!article) return res.status(404).json({ error: 'Article not found' });
      const analysis = seoService.analyzArticle(article);
      await article.update({ seoScore: analysis.score, seoAnalysis: analysis });
      res.json({ success: true, data: analysis });
    } catch (error) {
      res.status(500).json({ error: 'SEO analysis failed' });
    }
  }

  async bulkAnalyze(req, res) {
    try {
      const articles = await Article.findAll({ where: { status: 'published' }, limit: 100, order: [['seoScore', 'ASC']] });
      const results = [];
      for (const article of articles) {
        const analysis = seoService.analyzArticle(article);
        await article.update({ seoScore: analysis.score, seoAnalysis: analysis });
        results.push({ id: article.id, title: article.title, slug: article.slug, score: analysis.score });
      }
      res.json({
        success: true, data: results,
        summary: {
          total: results.length,
          avgScore: Math.round(results.reduce((sum, r) => sum + r.score, 0) / Math.max(results.length, 1)),
          needsImprovement: results.filter(r => r.score < 60).length,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Bulk analysis failed' });
    }
  }

  async getOverview(req, res) {
    try {
      const articles = await Article.findAll({
        where: { status: 'published' },
        attributes: ['id', 'title', 'slug', 'seoScore', 'views', 'publishedAt'],
        order: [['seoScore', 'ASC']],
      });

      const scores = articles.map(a => a.seoScore || 0);
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      res.json({
        success: true,
        data: {
          avgScore, totalArticles: articles.length,
          distribution: {
            excellent: scores.filter(s => s >= 80).length,
            good: scores.filter(s => s >= 60 && s < 80).length,
            fair: scores.filter(s => s >= 40 && s < 60).length,
            poor: scores.filter(s => s < 40).length,
          },
          needsImprovement: articles.filter(a => (a.seoScore || 0) < 60).slice(0, 10).map(a => ({ id: a.id, title: a.title, slug: a.slug, score: a.seoScore })),
          topPerformers: articles.filter(a => (a.seoScore || 0) >= 80).sort((a, b) => b.views - a.views).slice(0, 5).map(a => ({ id: a.id, title: a.title, slug: a.slug, score: a.seoScore, views: a.views })),
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch SEO overview' });
    }
  }

  async getSchemaMarkup(req, res) {
    try {
      const article = await Article.findByPk(req.params.id);
      if (!article) return res.status(404).json({ error: 'Article not found' });
      const schema = seoService.generateArticleSchema(article, null, null);
      res.json({ success: true, data: schema });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate schema' });
    }
  }

  async suggestKeywords(req, res) {
    try {
      const { title, content } = req.body;
      const text = (title + ' ' + (content || '').replace(/<[^>]*>/g, '')).toLowerCase();
      const words = text.split(/\s+/).filter(w => w.length > 3);
      const stopWords = new Set(['this', 'that', 'with', 'from', 'have', 'been', 'will', 'they', 'their', 'which', 'about', 'would', 'there', 'other', 'more', 'some', 'when', 'what']);
      const frequency = {};
      words.forEach(word => {
        const clean = word.replace(/[^a-z]/g, '');
        if (clean.length > 3 && !stopWords.has(clean)) {
          frequency[clean] = (frequency[clean] || 0) + 1;
        }
      });
      const suggestions = Object.entries(frequency).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([keyword, count]) => ({ keyword, frequency: count }));
      res.json({ success: true, data: suggestions });
    } catch (error) {
      res.status(500).json({ error: 'Failed to suggest keywords' });
    }
  }
}

module.exports = new SEOController();