const { User, Article, Media, Category, Analytics, Setting, NewsletterSubscriber, ContactMessage } = require('../models');
const { Op } = require('sequelize');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const SETTINGS_KEY = 'site';

const firstConfiguredUrl = () => {
  const frontendUrl = process.env.FRONTEND_URL?.split(',')[0]?.trim();
  const siteUrl = process.env.SITE_URL || frontendUrl || 'https://www.pulsetoob.com';
  return siteUrl.replace(/\/+$/, '');
};

const toBoolean = (value, fallback) => (typeof value === 'boolean' ? value : fallback);

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeSettings = (input = {}) => {
  const siteUrl = String(input.siteUrl || input.site?.url || firstConfiguredUrl()).replace(/\/+$/, '');
  const siteName = String(input.siteName || input.site?.name || 'PulseToob').trim() || 'PulseToob';
  const postsPerPage = toPositiveInt(input.postsPerPage ?? input.content?.postsPerPage, 12);
  const allowComments = toBoolean(input.allowComments ?? input.content?.allowComments, true);
  const enableRss = toBoolean(input.enableRss ?? input.rss?.enabled, true);
  const msnEnabled = toBoolean(input.msn?.enable ?? input.msn?.enabled, false);
  const msnFeedUrl = input.msn?.feedUrl || `${siteUrl}/api/rss/msn`;

  return {
    siteName,
    siteUrl,
    postsPerPage,
    allowComments,
    enableRss,
    msn: {
      enable: msnEnabled,
      enabled: msnEnabled,
      feedUrl: msnFeedUrl,
    },
    site: { name: siteName, url: siteUrl, language: input.site?.language || 'en' },
    content: { postsPerPage, allowComments },
    seo: { enableSitemap: input.seo?.enableSitemap !== false },
    rss: { enabled: enableRss, itemsPerFeed: toPositiveInt(input.rss?.itemsPerFeed, 50) },
  };
};

const ROLE_PERMISSIONS = {
  super_admin: {
    canPublish: true, canEdit: true, canDelete: true,
    canManageUsers: true, canManageSettings: true,
    canManageCategories: true, canManageMedia: true, canViewAnalytics: true,
  },
  admin: {
    canPublish: true, canEdit: true, canDelete: true,
    canManageUsers: true, canManageSettings: true,
    canManageCategories: true, canManageMedia: true, canViewAnalytics: true,
  },
  editor: {
    canPublish: true, canEdit: true, canDelete: false,
    canManageUsers: false, canManageSettings: false,
    canManageCategories: true, canManageMedia: true, canViewAnalytics: true,
  },
  author: {
    canPublish: false, canEdit: true, canDelete: false,
    canManageUsers: false, canManageSettings: false,
    canManageCategories: false, canManageMedia: true, canViewAnalytics: true,
  },
  contributor: {
    canPublish: false, canEdit: true, canDelete: false,
    canManageUsers: false, canManageSettings: false,
    canManageCategories: false, canManageMedia: true, canViewAnalytics: false,
  },
  subscriber: {
    canPublish: false, canEdit: false, canDelete: false,
    canManageUsers: false, canManageSettings: false,
    canManageCategories: false, canManageMedia: false, canViewAnalytics: false,
  },
};

class AdminController {
  async getOverview(req, res) {
    try {
      const [totalUsers, totalArticles, totalMedia, totalCategories,
        publishedArticles, draftArticles, scheduledArticles, totalViews] = await Promise.all([
        User.count(), Article.count(), Media.count(),
        Category.count({ where: { isActive: true } }),
        Article.count({ where: { status: 'published' } }),
        Article.count({ where: { status: 'draft' } }),
        Article.count({ where: { status: 'scheduled' } }),
        Article.sum('views'),
      ]);

      const storageUsed = await Media.sum('size');

      return sendSuccess(res, {
        data: {
          users: totalUsers,
          articles: { total: totalArticles, published: publishedArticles, drafts: draftArticles, scheduled: scheduledArticles },
          media: totalMedia, categories: totalCategories,
          views: { total: totalViews || 0 },
          storage: { used: storageUsed || 0, usedFormatted: this.formatBytes(storageUsed || 0) },
        },
      });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Failed to fetch overview' });
    }
  }

  async getUsers(req, res) {
    try {
      const { page = 1, limit = 20, role, search } = req.query;
      const pageNumber = parseInt(page, 10);
      const pageSize = parseInt(limit, 10);
      const offset = (pageNumber - 1) * pageSize;
      const where = {};
      if (role) where.role = role;
      if (search) {
        where[Op.or] = [
          { username: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { count, rows } = await User.findAndCountAll({
        where, limit: pageSize, offset,
        order: [['createdAt', 'DESC']],
        attributes: { exclude: ['password', 'twoFactorSecret', 'refreshToken'] },
      });

      return sendSuccess(res, {
        data: rows,
        pagination: {
          total: count,
          page: pageNumber,
          limit: pageSize,
          pages: Math.ceil(count / pageSize),
          hasNext: offset + pageSize < count,
          hasPrev: pageNumber > 1,
        },
      });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Failed to fetch users' });
    }
  }

  async createUser(req, res) {
    try {
      if (req.userRole !== 'super_admin') {
        return sendError(res, { status: 403, message: 'Only a super admin can create users' });
      }

      const { username, email, password, firstName, lastName, bio, role = 'contributor', isActive = true, isVerified = true } = req.body;
      const existingUser = await User.findOne({ where: { [Op.or]: [{ email }, { username }] } });

      if (existingUser) {
        return sendError(res, {
          status: 409,
          message: existingUser.email === email ? 'Email already registered' : 'Username already taken',
        });
      }

      const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.contributor;
      const user = await User.create({
        username,
        email,
        password,
        firstName,
        lastName,
        bio,
        role,
        permissions,
        isActive,
        isVerified,
      });

      return sendSuccess(res, { status: 201, data: user, message: 'User created successfully' });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Failed to create user' });
    }
  }

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);
      if (!user) return sendError(res, { status: 404, message: 'User not found' });
      if (id === req.userId && req.body.role) return sendError(res, { status: 400, message: 'Cannot change your own role' });
      if (req.body.role === 'super_admin' && req.userRole !== 'super_admin') return sendError(res, { status: 403, message: 'Only a super admin can assign the super admin role' });

      const allowedUpdates = ['role', 'permissions', 'isActive', 'isVerified'];
      const updates = {};
      allowedUpdates.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });
      if (updates.role && !updates.permissions) updates.permissions = ROLE_PERMISSIONS[updates.role] || user.permissions;
      await user.update(updates);
      return sendSuccess(res, { data: user, message: 'User updated successfully' });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Failed to update user' });
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      if (id === req.userId) return sendError(res, { status: 400, message: 'Cannot delete your own account' });
      const user = await User.findByPk(id);
      if (!user) return sendError(res, { status: 404, message: 'User not found' });
      if (user.role === 'super_admin' && req.userRole !== 'super_admin') return sendError(res, { status: 403, message: 'Only a super admin can delete a super admin' });
      await Article.update({ authorId: req.userId }, { where: { authorId: id } });
      await user.destroy();
      return sendSuccess(res, { message: 'User deleted successfully' });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Failed to delete user' });
    }
  }

  async getNewsletterSubscribers(req, res) {
    try {
      const { page = 1, limit = 50, status, search } = req.query;
      const pageNumber = parseInt(page, 10);
      const pageSize = parseInt(limit, 10);
      const offset = (pageNumber - 1) * pageSize;
      const where = {};

      if (status) where.status = status;
      if (search) where.email = { [Op.iLike]: `%${search}%` };

      const { count, rows } = await NewsletterSubscriber.findAndCountAll({
        where,
        limit: pageSize,
        offset,
        order: [['createdAt', 'DESC']],
      });

      return sendSuccess(res, {
        data: rows,
        pagination: {
          total: count,
          page: pageNumber,
          limit: pageSize,
          pages: Math.ceil(count / pageSize),
          hasNext: offset + pageSize < count,
          hasPrev: pageNumber > 1,
        },
      });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Failed to fetch newsletter subscribers' });
    }
  }

  async updateNewsletterSubscriber(req, res) {
    try {
      const subscriber = await NewsletterSubscriber.findByPk(req.params.id);
      if (!subscriber) return sendError(res, { status: 404, message: 'Subscriber not found' });

      const updates = {};
      if (['active', 'unsubscribed'].includes(req.body.status)) updates.status = req.body.status;

      await subscriber.update(updates);
      return sendSuccess(res, { data: subscriber, message: 'Subscriber updated successfully' });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Failed to update subscriber' });
    }
  }

  async getContactMessages(req, res) {
    try {
      const { page = 1, limit = 50, status, topic, search } = req.query;
      const pageNumber = parseInt(page, 10);
      const pageSize = parseInt(limit, 10);
      const offset = (pageNumber - 1) * pageSize;
      const where = {};

      if (status) where.status = status;
      if (topic) where.topic = topic;
      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { subject: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { count, rows } = await ContactMessage.findAndCountAll({
        where,
        limit: pageSize,
        offset,
        order: [['createdAt', 'DESC']],
      });

      return sendSuccess(res, {
        data: rows,
        pagination: {
          total: count,
          page: pageNumber,
          limit: pageSize,
          pages: Math.ceil(count / pageSize),
          hasNext: offset + pageSize < count,
          hasPrev: pageNumber > 1,
        },
      });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Failed to fetch contact messages' });
    }
  }

  async updateContactMessage(req, res) {
    try {
      const message = await ContactMessage.findByPk(req.params.id);
      if (!message) return sendError(res, { status: 404, message: 'Contact message not found' });

      const updates = {};
      if (['new', 'reviewed', 'archived'].includes(req.body.status)) updates.status = req.body.status;

      await message.update(updates);
      return sendSuccess(res, { data: message, message: 'Contact message updated successfully' });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Failed to update contact message' });
    }
  }

  async getSettings(req, res) {
    try {
      const record = await Setting.findByPk(SETTINGS_KEY);
      return sendSuccess(res, { data: normalizeSettings(record?.value) });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Failed to fetch settings' });
    }
  }

  async updateSettings(req, res) {
    try {
      const settings = normalizeSettings(req.body);
      await Setting.upsert({ name: SETTINGS_KEY, value: settings });
      return sendSuccess(res, { data: settings, message: 'Settings updated successfully' });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Failed to update settings' });
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = new AdminController();
