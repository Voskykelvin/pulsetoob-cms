const { Advertisement, sequelize } = require('../models');
const { Op } = require('sequelize');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const activeWindowWhere = () => {
  const now = new Date();

  return {
    isActive: true,
    [Op.and]: [
      { [Op.or]: [{ startDate: null }, { startDate: { [Op.lte]: now } }] },
      { [Op.or]: [{ endDate: null }, { endDate: { [Op.gte]: now } }] },
    ],
  };
};

class AdController {
  async getActiveAd(req, res) {
    try {
      const { slot } = req.params;
      const ad = await Advertisement.findOne({
        where: { slot, ...activeWindowWhere() },
        order: sequelize.random(),
      });

      return sendSuccess(res, { data: ad });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Failed to fetch advertisement' });
    }
  }

  async trackImpression(req, res) {
    try {
      const ad = await Advertisement.findByPk(req.params.id);
      if (!ad) return sendError(res, { status: 404, message: 'Advertisement not found' });

      await ad.increment('impressions');
      return sendSuccess(res, { message: 'Impression tracked' });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Failed to track impression' });
    }
  }

  async trackClick(req, res) {
    try {
      const ad = await Advertisement.findByPk(req.params.id);
      if (!ad) return sendError(res, { status: 404, message: 'Advertisement not found' });

      await ad.increment('clicks');
      return sendSuccess(res, { message: 'Click tracked' });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Failed to track click' });
    }
  }

  async listAds(req, res) {
    try {
      const { slot, isActive } = req.query;
      const where = {};
      if (slot) where.slot = slot;
      if (isActive) where.isActive = isActive === 'true';

      const ads = await Advertisement.findAll({
        where,
        order: [['createdAt', 'DESC']],
      });

      return sendSuccess(res, { data: ads });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Failed to fetch advertisements' });
    }
  }

  async createAd(req, res) {
    try {
      const payload = this.normalizeAdPayload(req.body);
      const ad = await Advertisement.create(payload);
      return sendSuccess(res, { status: 201, data: ad, message: 'Advertisement created successfully' });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Failed to create advertisement' });
    }
  }

  async updateAd(req, res) {
    try {
      const ad = await Advertisement.findByPk(req.params.id);
      if (!ad) return sendError(res, { status: 404, message: 'Advertisement not found' });

      await ad.update(this.normalizeAdPayload(req.body));
      return sendSuccess(res, { data: ad, message: 'Advertisement updated successfully' });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Failed to update advertisement' });
    }
  }

  async deleteAd(req, res) {
    try {
      const ad = await Advertisement.findByPk(req.params.id);
      if (!ad) return sendError(res, { status: 404, message: 'Advertisement not found' });

      await ad.destroy();
      return sendSuccess(res, { message: 'Advertisement deleted successfully' });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Failed to delete advertisement' });
    }
  }

  normalizeAdPayload(payload) {
    const fields = ['title', 'imageUrl', 'targetUrl', 'slot', 'sponsorName', 'isActive'];
    const normalized = {};

    fields.forEach((field) => {
      if (payload[field] !== undefined) normalized[field] = payload[field];
    });

    if (payload.startDate !== undefined) normalized.startDate = payload.startDate ? new Date(payload.startDate) : null;
    if (payload.endDate !== undefined) normalized.endDate = payload.endDate ? new Date(payload.endDate) : null;

    return normalized;
  }
}

module.exports = new AdController();
