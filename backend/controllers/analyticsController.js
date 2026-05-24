const { Analytics, Article, sequelize } = require('../models');
const { Op } = require('sequelize');

class AnalyticsController {
  async trackEvent(req, res) {
    try {
      const { articleId, eventType, sessionId, visitorId, source, medium, referrer, duration } = req.body;
      const userAgent = req.headers['user-agent'];

      await Analytics.create({
        articleId, eventType, sessionId, visitorId,
        source, medium, referrer: referrer || req.headers.referer,
        userAgent, ipAddress: req.ip,
        device: this.detectDevice(userAgent),
        browser: this.detectBrowser(userAgent),
        os: this.detectOS(userAgent),
        duration, metadata: req.body.metadata || {},
      });

      if (eventType === 'article_view' && articleId) {
        await Article.increment('views', { where: { id: articleId } });
      }

      res.status(201).json({ success: true });
    } catch (error) {
      res.status(201).json({ success: true });
    }
  }

  async getDashboard(req, res) {
    try {
      const { period = '7d' } = req.query;
      const startDate = this.getStartDate(period);

      const totalViews = await Analytics.count({ where: { eventType: 'article_view', createdAt: { [Op.gte]: startDate } } });
      const uniqueVisitors = await Analytics.count({ where: { createdAt: { [Op.gte]: startDate } }, distinct: true, col: 'visitorId' });

      const viewsByDay = await Analytics.findAll({
        where: { eventType: 'article_view', createdAt: { [Op.gte]: startDate } },
        attributes: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'date'], [sequelize.fn('COUNT', '*'), 'views']],
        group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
        order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
        raw: true,
      });

      const trafficSources = await Analytics.findAll({
        where: { createdAt: { [Op.gte]: startDate }, source: { [Op.ne]: null } },
        attributes: ['source', [sequelize.fn('COUNT', '*'), 'count']],
        group: ['source'],
        order: [[sequelize.fn('COUNT', '*'), 'DESC']],
        limit: 10, raw: true,
      });

      const deviceBreakdown = await Analytics.findAll({
        where: { createdAt: { [Op.gte]: startDate }, device: { [Op.ne]: null } },
        attributes: ['device', [sequelize.fn('COUNT', '*'), 'count']],
        group: ['device'], raw: true,
      });

      const avgDuration = await Analytics.findOne({
        where: { eventType: 'time_on_page', createdAt: { [Op.gte]: startDate }, duration: { [Op.gt]: 0 } },
        attributes: [[sequelize.fn('AVG', sequelize.col('duration')), 'avgDuration']],
        raw: true,
      });

      res.json({
        success: true,
        data: {
          overview: {
            totalViews, uniqueVisitors,
            avgDuration: Math.round(avgDuration?.avgDuration || 0),
            bounceRate: 0,
          },
          viewsByDay, trafficSources, deviceBreakdown, period,
        },
      });
    } catch (error) {
      console.error('Analytics dashboard error:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  }

  async getArticleAnalytics(req, res) {
    try {
      const { id } = req.params;
      const { period = '30d' } = req.query;
      const startDate = this.getStartDate(period);

      const article = await Article.findByPk(id, { attributes: ['id', 'title', 'slug', 'views', 'shares', 'publishedAt'] });
      if (!article) return res.status(404).json({ error: 'Article not found' });

      const viewsByDay = await Analytics.findAll({
        where: { articleId: id, eventType: 'article_view', createdAt: { [Op.gte]: startDate } },
        attributes: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'date'], [sequelize.fn('COUNT', '*'), 'views']],
        group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
        order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
        raw: true,
      });

      res.json({ success: true, data: { article, viewsByDay } });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch article analytics' });
    }
  }

  getStartDate(period) {
    const now = new Date();
    switch (period) {
      case '24h': return new Date(now - 24 * 60 * 60 * 1000);
      case '7d': return new Date(now - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now - 30 * 24 * 60 * 60 * 1000);
      case '90d': return new Date(now - 90 * 24 * 60 * 60 * 1000);
      default: return new Date(now - 7 * 24 * 60 * 60 * 1000);
    }
  }

  detectDevice(ua) {
    if (!ua) return 'unknown';
    if (/tablet|ipad/i.test(ua)) return 'tablet';
    if (/mobile|iphone|android.*mobile/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  detectBrowser(ua) {
    if (!ua) return 'unknown';
    if (/chrome/i.test(ua) && !/edge/i.test(ua)) return 'Chrome';
    if (/firefox/i.test(ua)) return 'Firefox';
    if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
    if (/edge/i.test(ua)) return 'Edge';
    return 'Other';
  }

  detectOS(ua) {
    if (!ua) return 'unknown';
    if (/windows/i.test(ua)) return 'Windows';
    if (/macintosh|mac os/i.test(ua)) return 'macOS';
    if (/linux/i.test(ua)) return 'Linux';
    if (/android/i.test(ua)) return 'Android';
    if (/iphone|ipad/i.test(ua)) return 'iOS';
    return 'Other';
  }
}

module.exports = new AnalyticsController();