const { Backlink, Article } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');

class BacklinkController {
  async getAll(req, res) {
    try {
      const { page = 1, limit = 20, articleId, type, broken } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const where = {};
      if (articleId) where.articleId = articleId;
      if (type) where.type = type;
      if (broken === 'true') where.isBroken = true;
      if (broken === 'false') where.isBroken = false;

      const { count, rows } = await Backlink.findAndCountAll({
        where, limit: parseInt(limit), offset,
        order: [['createdAt', 'DESC']],
        include: [{ model: Article, as: 'article', attributes: ['id', 'title', 'slug'] }],
      });

      res.json({ success: true, data: rows, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / parseInt(limit)) } });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch backlinks' });
    }
  }

  async create(req, res) {
    try {
      const { articleId, url, anchorText, targetUrl, type, relationship, position } = req.body;
      if (!articleId || !url || !anchorText) {
        return res.status(400).json({ error: 'articleId, url, and anchorText are required' });
      }

      let httpStatus = null;
      let isBroken = false;
      try {
        const response = await axios.head(url, { timeout: 10000, validateStatus: () => true });
        httpStatus = response.status;
        isBroken = response.status >= 400;
      } catch (e) { isBroken = true; }

      const backlink = await Backlink.create({
        articleId, url, anchorText, targetUrl: targetUrl || url,
        type: type || 'external', relationship: relationship || 'dofollow',
        position: position || 'content', lastChecked: new Date(), httpStatus, isBroken,
      });

      res.status(201).json({ success: true, data: backlink });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create backlink' });
    }
  }

  async update(req, res) {
    try {
      const backlink = await Backlink.findByPk(req.params.id);
      if (!backlink) return res.status(404).json({ error: 'Backlink not found' });
      const allowedFields = ['url', 'anchorText', 'targetUrl', 'type', 'relationship', 'position', 'isActive'];
      const updates = {};
      allowedFields.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });
      await backlink.update(updates);
      res.json({ success: true, data: backlink });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update backlink' });
    }
  }

  async delete(req, res) {
    try {
      const backlink = await Backlink.findByPk(req.params.id);
      if (!backlink) return res.status(404).json({ error: 'Backlink not found' });
      await backlink.destroy();
      res.json({ success: true, message: 'Backlink deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete backlink' });
    }
  }

  async checkHealth(req, res) {
    try {
      const { ids } = req.body;
      const where = ids ? { id: ids } : { isActive: true };
      const backlinks = await Backlink.findAll({ where, limit: 50 });
      const results = [];

      for (const backlink of backlinks) {
        try {
          const response = await axios.head(backlink.url, { timeout: 10000, validateStatus: () => true });
          await backlink.update({ lastChecked: new Date(), httpStatus: response.status, isBroken: response.status >= 400 });
          results.push({ id: backlink.id, url: backlink.url, status: response.status, broken: response.status >= 400 });
        } catch (e) {
          await backlink.update({ lastChecked: new Date(), isBroken: true, httpStatus: 0 });
          results.push({ id: backlink.id, url: backlink.url, status: 0, broken: true });
        }
      }

      res.json({ success: true, data: results, summary: { total: results.length, healthy: results.filter(r => !r.broken).length, broken: results.filter(r => r.broken).length } });
    } catch (error) {
      res.status(500).json({ error: 'Health check failed' });
    }
  }

  async getStats(req, res) {
    try {
      const total = await Backlink.count();
      const active = await Backlink.count({ where: { isActive: true } });
      const broken = await Backlink.count({ where: { isBroken: true } });
      const internal = await Backlink.count({ where: { type: 'internal' } });
      const external = await Backlink.count({ where: { type: 'external' } });
      const dofollow = await Backlink.count({ where: { relationship: 'dofollow' } });
      const nofollow = await Backlink.count({ where: { relationship: 'nofollow' } });
      res.json({ success: true, data: { total, active, broken, internal, external, dofollow, nofollow } });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  }
}

module.exports = new BacklinkController();