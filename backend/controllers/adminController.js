const { User, Article, Media, Category, Analytics } = require('../models');
const { Op } = require('sequelize');
const { sendSuccess, sendError } = require('../utils/apiResponse');

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

  async getSettings(req, res) {
    res.json({
      success: true,
      data: {
        site: { name: 'PulseToob', url: process.env.SITE_URL, language: 'en' },
        content: { postsPerPage: 12, allowComments: true },
        seo: { enableSitemap: true },
        rss: { enabled: true, itemsPerFeed: 50 },
        msn: { enabled: false, feedUrl: `${process.env.SITE_URL}/api/rss/msn` },
      },
    });
  }

  async updateSettings(req, res) {
    res.json({ success: true, message: 'Settings updated successfully' });
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
