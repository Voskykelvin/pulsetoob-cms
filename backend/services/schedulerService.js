const { Article, Backlink } = require('../models');
const { Op } = require('sequelize');
const indexNowService = require('./indexNowService');

class SchedulerService {
  async publishScheduledArticles() {
    try {
      const now = new Date();
      const scheduledArticles = await Article.findAll({
        where: { status: 'scheduled', scheduledFor: { [Op.lte]: now } },
      });

      for (const article of scheduledArticles) {
        await article.update({ status: 'published', publishedAt: now });
        await indexNowService.submitArticle(article, 'scheduled_publish');
        console.log(`Published scheduled article: ${article.title}`);
      }
    } catch (error) {
      console.error('Scheduler publish error:', error);
    }
  }

  async checkBrokenLinks() {
    try {
      const axios = require('axios');
      const backlinks = await Backlink.findAll({
        where: { isActive: true, [Op.or]: [{ lastChecked: null }, { lastChecked: { [Op.lt]: new Date(Date.now() - 6 * 60 * 60 * 1000) } }] },
        limit: 50,
      });

      for (const backlink of backlinks) {
        try {
          const response = await axios.head(backlink.url, { timeout: 10000, validateStatus: () => true });
          await backlink.update({ lastChecked: new Date(), httpStatus: response.status, isBroken: response.status >= 400 });
        } catch (e) {
          await backlink.update({ lastChecked: new Date(), isBroken: true, httpStatus: 0 });
        }
      }
    } catch (error) {
      console.error('Backlink check error:', error);
    }
  }

  async generateSitemap() {
    console.log('Sitemap generation triggered');
  }

  async cleanupSessions() {
    console.log('Session cleanup triggered');
  }
}

module.exports = new SchedulerService();
