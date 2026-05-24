const { Article, Category, Media, User } = require('../models');
const { Op } = require('sequelize');
const rssService = require('../services/rssService');

class MSNController {
  async getEligibleArticles(req, res) {
    try {
      const { page = 1, limit = 20, submitted } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const where = { msnEligible: true, status: 'published' };
      if (submitted === 'true') where.msnSubmitted = true;
      if (submitted === 'false') where.msnSubmitted = false;

      const { count, rows } = await Article.findAndCountAll({
        where, limit: parseInt(limit), offset,
        order: [['publishedAt', 'DESC']],
        include: [
          { model: User, as: 'author', attributes: ['id', 'username'] },
          { model: Media, as: 'featuredImage', attributes: ['url', 'thumbnailUrl', 'width', 'height'] },
          { model: Category, as: 'categories', attributes: ['id', 'name', 'slug'] },
        ],
      });

      res.json({ success: true, data: rows, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / parseInt(limit)) } });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch MSN articles' });
    }
  }

  async toggleEligibility(req, res) {
    try {
      const article = await Article.findByPk(req.params.id);
      if (!article) return res.status(404).json({ error: 'Article not found' });

      const issues = [];
      if (!article.featuredImageId) issues.push('Featured image required');
      if (article.wordCount < 300) issues.push('Minimum 300 words required');
      if (!article.metaDescription || article.metaDescription.length < 50) issues.push('Meta description must be at least 50 characters');

      if (issues.length > 0 && !article.msnEligible) {
        return res.status(400).json({ error: 'Article does not meet MSN requirements', issues });
      }

      await article.update({ msnEligible: !article.msnEligible });
      res.json({ success: true, data: { msnEligible: article.msnEligible }, message: `Article ${article.msnEligible ? 'enabled' : 'disabled'} for MSN` });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update MSN status' });
    }
  }

  async bulkEnable(req, res) {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'Article IDs required' });

      const articles = await Article.findAll({ where: { id: ids, status: 'published', featuredImageId: { [Op.ne]: null }, wordCount: { [Op.gte]: 300 } } });
      const eligibleIds = articles.map(a => a.id);
      await Article.update({ msnEligible: true }, { where: { id: eligibleIds } });

      res.json({ success: true, message: `${eligibleIds.length} articles enabled for MSN`, skipped: ids.length - eligibleIds.length });
    } catch (error) {
      res.status(500).json({ error: 'Bulk enable failed' });
    }
  }

  async getFeedPreview(req, res) {
    try {
      const xml = await rssService.generateMSNFeed();
      res.set('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate MSN feed preview' });
    }
  }

  async getStats(req, res) {
    try {
      const totalEligible = await Article.count({ where: { msnEligible: true, status: 'published' } });
      const totalSubmitted = await Article.count({ where: { msnSubmitted: true } });
      const pending = await Article.count({ where: { msnStatus: 'pending' } });
      const approved = await Article.count({ where: { msnStatus: 'approved' } });
      const rejected = await Article.count({ where: { msnStatus: 'rejected' } });
      res.json({ success: true, data: { totalEligible, totalSubmitted, pending, approved, rejected, feedUrl: `${process.env.SITE_URL}/api/rss/msn` } });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch MSN stats' });
    }
  }
}

module.exports = new MSNController();