const { Article, User, Category, Media, Tag, Backlink, sequelize } = require('../models');
const { Op } = require('sequelize');
const slugify = require('slugify');
const sanitizeHtml = require('sanitize-html');
const seoService = require('../services/seoService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'publishedAt', 'title', 'views', 'status'];
const ALLOWED_SORT_ORDERS = ['ASC', 'DESC'];
const ARTICLE_UPDATE_FIELDS = [
  'title',
  'content',
  'excerpt',
  'subtitle',
  'featuredImageId',
  'videoUrl',
  'videoEmbed',
  'metaTitle',
  'metaDescription',
  'metaKeywords',
  'canonicalUrl',
  'ogImage',
  'ogTitle',
  'ogDescription',
  'status',
  'scheduledFor',
  'isFeatured',
  'isBreaking',
  'isPinned',
  'allowComments',
  'rssIncluded',
  'msnEligible',
  'template',
];

function pickArticleUpdates(body) {
  return ARTICLE_UPDATE_FIELDS.reduce((updates, field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      updates[field] = body[field];
    }
    return updates;
  }, {});
}

async function recalculateCategoryArticleCounts(categoryIds, transaction) {
  const uniqueIds = [...new Set((categoryIds || []).filter(Boolean))];

  for (const categoryId of uniqueIds) {
    const articleCount = await Article.count({
      include: [{
        model: Category,
        as: 'categories',
        where: { id: categoryId },
        attributes: [],
        through: { attributes: [] },
      }],
      transaction,
    });

    await Category.update({ articleCount }, { where: { id: categoryId }, transaction });
  }
}

class ArticleController {
  async create(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const { title, content, excerpt, subtitle, categoryIds, tagNames,
        featuredImageId, videoUrl, videoEmbed, metaTitle, metaDescription,
        metaKeywords, canonicalUrl, ogImage, ogTitle, ogDescription,
        status, scheduledFor, isFeatured, isBreaking, isPinned,
        allowComments, rssIncluded, msnEligible, template } = req.body;

      let slug = slugify(title, { lower: true, strict: true });
      const existingSlug = await Article.findOne({ where: { slug } });
      if (existingSlug) slug = `${slug}-${Date.now().toString(36)}`;

      const sanitizedContent = sanitizeHtml(content || '', {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'iframe', 'video', 'h1', 'h2', 'h3', 'figure', 'figcaption']),
        allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, '*': ['class', 'id', 'style'], img: ['src', 'alt', 'title', 'width', 'height'], iframe: ['src', 'width', 'height', 'frameborder', 'allowfullscreen'], a: ['href', 'target', 'rel'] },
      });

      const contentPlainText = sanitizedContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      const wordCount = contentPlainText.split(/\s+/).filter(w => w.length > 0).length;
      const readTime = Math.ceil(wordCount / 200);
      const finalExcerpt = excerpt || contentPlainText.substring(0, 280);

      const article = await Article.create({
        title, slug, subtitle, excerpt: finalExcerpt,
        content: sanitizedContent, contentPlainText,
        authorId: req.userId, featuredImageId: featuredImageId || null,
        videoUrl, videoEmbed,
        metaTitle: metaTitle || title.substring(0, 70),
        metaDescription: metaDescription || finalExcerpt.substring(0, 160),
        metaKeywords: metaKeywords || [],
        canonicalUrl, ogImage,
        ogTitle: ogTitle || title.substring(0, 95),
        ogDescription: ogDescription || finalExcerpt.substring(0, 200),
        readTime, wordCount,
        status: status || 'draft',
        publishedAt: status === 'published' ? new Date() : null,
        scheduledFor: status === 'scheduled' ? new Date(scheduledFor) : null,
        isFeatured: isFeatured || false, isBreaking: isBreaking || false,
        isPinned: isPinned || false, allowComments: allowComments !== false,
        rssIncluded: rssIncluded !== false, msnEligible: msnEligible || false,
        template: template || 'default',
      }, { transaction });

      if (article.isPinned && article.status === 'published') {
        await Article.update({ isPinned: false }, { where: { id: { [Op.ne]: article.id } }, transaction });
      }

      if (categoryIds && categoryIds.length > 0) {
        await article.setCategories(categoryIds, { transaction });
        await recalculateCategoryArticleCounts(categoryIds, transaction);
      }

      if (tagNames && tagNames.length > 0) {
        const tags = [];
        for (const tagName of tagNames) {
          const tagSlug = slugify(tagName, { lower: true, strict: true });
          const [tag] = await Tag.findOrCreate({ where: { slug: tagSlug }, defaults: { name: tagName, slug: tagSlug }, transaction });
          tags.push(tag);
        }
        await article.setTags(tags, { transaction });
      }

      const seoAnalysis = seoService.analyzArticle({ title, content: sanitizedContent, metaDescription: metaDescription || finalExcerpt.substring(0, 160), metaKeywords: metaKeywords || [], slug, featuredImage: featuredImageId ? { url: 'exists' } : null });
      await article.update({ seoScore: seoAnalysis.score, seoAnalysis }, { transaction });

      await transaction.commit();

      const fullArticle = await Article.findByPk(article.id, {
        include: [
          { model: User, as: 'author', attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'] },
          { model: Category, as: 'categories' },
          { model: Tag, as: 'tags' },
          { model: Media, as: 'featuredImage' },
        ],
      });

      return sendSuccess(res, { status: 201, data: fullArticle, message: `Article ${status === 'published' ? 'published' : 'saved'} successfully` });
    } catch (error) {
      await transaction.rollback();
      console.error('Create article error:', error);
      return sendError(res, { status: 500, message: 'Failed to create article', details: error.message });
    }
  }

  async update(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const article = await Article.findByPk(id);
      if (!article) return sendError(res, { status: 404, message: 'Article not found' });

      if (article.authorId !== req.userId && !['admin', 'editor', 'super_admin'].includes(req.userRole)) {
        return sendError(res, { status: 403, message: 'Not authorized to edit this article' });
      }

      const updates = pickArticleUpdates(req.body);
      const hasCategoryUpdates = Object.prototype.hasOwnProperty.call(req.body, 'categoryIds');
      const hasTagUpdates = Object.prototype.hasOwnProperty.call(req.body, 'tagNames');
      const categoryIds = hasCategoryUpdates ? req.body.categoryIds : undefined;
      const tagNames = hasTagUpdates ? req.body.tagNames : undefined;
      const previousCategories = hasCategoryUpdates
        ? await article.getCategories({ attributes: ['id'], transaction })
        : [];

      if (Object.prototype.hasOwnProperty.call(req.body, 'section')) {
        updates.customFields = {
          ...(article.customFields || {}),
          section: req.body.section || null,
        };
      }

      if (updates.title && updates.title !== article.title) {
        let slug = slugify(updates.title, { lower: true, strict: true });
        const existingSlug = await Article.findOne({ where: { slug, id: { [Op.ne]: id } } });
        if (existingSlug) slug = `${slug}-${Date.now().toString(36)}`;
        updates.slug = slug;
      }

      if (updates.content) {
        updates.content = sanitizeHtml(updates.content, {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'iframe', 'video', 'h1', 'h2', 'h3', 'figure', 'figcaption']),
          allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, '*': ['class', 'id', 'style'], img: ['src', 'alt', 'title', 'width', 'height'], iframe: ['src', 'width', 'height', 'frameborder', 'allowfullscreen'] },
        });
        updates.contentPlainText = updates.content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        updates.wordCount = updates.contentPlainText.split(/\s+/).filter(w => w.length > 0).length;
        updates.readTime = Math.ceil(updates.wordCount / 200);
      }

      if (updates.status === 'published' && article.status !== 'published') updates.publishedAt = new Date();
      if (updates.status === 'scheduled' && updates.scheduledFor) updates.scheduledFor = new Date(updates.scheduledFor);

      const revision = { version: article.version, title: article.title, modifiedBy: req.userId, modifiedAt: new Date() };
      updates.revisionHistory = [...(article.revisionHistory || []), revision].slice(-10);
      updates.version = article.version + 1;

      if (updates.isPinned === true && (updates.status === 'published' || article.status === 'published')) {
        await Article.update({ isPinned: false }, { where: { id: { [Op.ne]: id } }, transaction });
      }

      await article.update(updates, { transaction });

      if (hasCategoryUpdates) {
        await article.setCategories(categoryIds || [], { transaction });
        await recalculateCategoryArticleCounts([
          ...previousCategories.map(category => category.id),
          ...(categoryIds || []),
        ], transaction);
      }

      if (hasTagUpdates) {
        const tags = [];
        for (const tagName of tagNames || []) {
          const tagSlug = slugify(tagName, { lower: true, strict: true });
          const [tag] = await Tag.findOrCreate({ where: { slug: tagSlug }, defaults: { name: tagName, slug: tagSlug }, transaction });
          tags.push(tag);
        }
        await article.setTags(tags, { transaction });
      }

      await transaction.commit();

      const updatedArticle = await Article.findByPk(id, {
        include: [
          { model: User, as: 'author', attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'] },
          { model: Category, as: 'categories' },
          { model: Tag, as: 'tags' },
          { model: Media, as: 'featuredImage' },
        ],
      });

      return sendSuccess(res, { data: updatedArticle, message: 'Article updated successfully' });
    } catch (error) {
      await transaction.rollback();
      console.error('Update article error:', error);
      return sendError(res, { status: 500, message: 'Failed to update article', details: error.message });
    }
  }

  async getOne(req, res) {
    try {
      const { slugOrId } = req.params;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
      const where = isUUID ? { id: slugOrId } : { slug: slugOrId };

      const article = await Article.findOne({
        where,
        include: [
          { model: User, as: 'author', attributes: ['id', 'username', 'firstName', 'lastName', 'avatar', 'bio'] },
          { model: Category, as: 'categories' },
          { model: Tag, as: 'tags' },
          { model: Media, as: 'featuredImage' },
          { model: Backlink, as: 'backlinks', where: { isActive: true }, required: false },
        ],
      });

      if (!article) return sendError(res, { status: 404, message: 'Article not found' });

      if (article.status !== 'published') {
        if (!req.userId) return sendError(res, { status: 404, message: 'Article not found' });
        if (article.authorId !== req.userId && !['admin', 'editor', 'super_admin'].includes(req.userRole)) {
          return sendError(res, { status: 403, message: 'Access denied' });
        }
      }

      if (article.status === 'published' && article.authorId !== req.userId && req.query.trackView !== 'false') {
        await article.increment('views');
      }

      return sendSuccess(res, { data: article });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Failed to fetch article' });
    }
  }

  async getAll(req, res) {
    try {
      const { page = 1, limit = 12, category, tag, author, status,
        search, sortBy = 'publishedAt', sortOrder = 'DESC',
        featured, breaking, pinned } = req.query;

      const pageNumber = parseInt(page, 10);
      const pageSize = parseInt(limit, 10);
      const safeSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'publishedAt';
      const safeSortOrder = ALLOWED_SORT_ORDERS.includes(String(sortOrder).toUpperCase()) ? String(sortOrder).toUpperCase() : 'DESC';
      const offset = (pageNumber - 1) * pageSize;
      const where = {};
      const include = [
        { model: User, as: 'author', attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'] },
        { model: Media, as: 'featuredImage', attributes: ['id', 'url', 'thumbnailUrl', 'altText', 'caption'] },
      ];

      if (req.userId && ['admin', 'editor', 'super_admin'].includes(req.userRole)) {
        if (status) where.status = status;
      } else {
        where.status = 'published';
      }

      if (category) {
        include.push({ model: Category, as: 'categories', where: { slug: category }, required: true });
      } else {
        include.push({ model: Category, as: 'categories', required: false });
      }

      if (tag) {
        include.push({ model: Tag, as: 'tags', where: { slug: tag }, required: true });
      } else {
        include.push({ model: Tag, as: 'tags', required: false });
      }

      if (author) where.authorId = author;
      if (featured === 'true') where.isFeatured = true;
      if (breaking === 'true') where.isBreaking = true;
      if (pinned === 'true') where.isPinned = true;

      if (search) {
        where[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { contentPlainText: { [Op.iLike]: `%${search}%` } },
          { excerpt: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { count, rows } = await Article.findAndCountAll({
        where, include,
        limit: pageSize, offset,
        order: [[safeSortBy, safeSortOrder]],
        distinct: true,
      });

      return sendSuccess(res, {
        data: rows,
        pagination: {
          total: count, page: pageNumber, limit: pageSize,
          pages: Math.ceil(count / pageSize),
          hasNext: offset + pageSize < count,
          hasPrev: pageNumber > 1,
        },
      });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Failed to fetch articles' });
    }
  }

  async trackView(req, res) {
    try {
      const { slugOrId } = req.params;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
      const where = isUUID ? { id: slugOrId } : { slug: slugOrId };

      const article = await Article.findOne({
        where: { ...where, status: 'published' },
        attributes: ['id', 'views'],
      });

      if (!article) return sendError(res, { status: 404, message: 'Article not found' });

      await article.increment('views');
      return sendSuccess(res, { data: { id: article.id }, message: 'View tracked' });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Failed to track view' });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const article = await Article.findByPk(id);
      if (!article) return sendError(res, { status: 404, message: 'Article not found' });

      if (article.authorId !== req.userId && !['admin', 'super_admin'].includes(req.userRole)) {
        return sendError(res, { status: 403, message: 'Not authorized' });
      }

      await article.destroy();
      return sendSuccess(res, { message: 'Article deleted successfully' });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Failed to delete article' });
    }
  }

  async publish(req, res) {
    try {
      const article = await Article.findByPk(req.params.id);
      if (!article) return sendError(res, { status: 404, message: 'Article not found' });
      if (article.isPinned) {
        await Article.update({ isPinned: false }, { where: { id: { [Op.ne]: article.id } } });
      }
      await article.update({ status: 'published', publishedAt: new Date() });
      return sendSuccess(res, { data: article, message: 'Article published successfully' });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Failed to publish article' });
    }
  }

  async unpublish(req, res) {
    try {
      const article = await Article.findByPk(req.params.id);
      if (!article) return sendError(res, { status: 404, message: 'Article not found' });
      await article.update({ status: 'draft' });
      return sendSuccess(res, { data: article, message: 'Article unpublished' });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Failed to unpublish article' });
    }
  }

  async schedule(req, res) {
    try {
      const { scheduledFor } = req.body;
      const scheduleDate = new Date(scheduledFor);
      if (scheduleDate <= new Date()) return sendError(res, { status: 400, message: 'Schedule date must be in the future' });
      const article = await Article.findByPk(req.params.id);
      if (!article) return sendError(res, { status: 404, message: 'Article not found' });
      await article.update({ status: 'scheduled', scheduledFor: scheduleDate });
      return sendSuccess(res, { data: article, message: 'Article scheduled successfully' });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Failed to schedule article' });
    }
  }

  async autoSave(req, res) {
    try {
      const { id } = req.params;
      const { title, content, excerpt } = req.body;
      const article = await Article.findByPk(id);
      if (!article) return sendError(res, { status: 404, message: 'Article not found' });
      if (article.authorId !== req.userId) return sendError(res, { status: 403, message: 'Not authorized' });

      const updates = {};
      if (title) updates.title = title;
      if (content) {
        updates.content = content;
        updates.contentPlainText = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        updates.wordCount = updates.contentPlainText.split(/\s+/).filter(w => w.length > 0).length;
        updates.readTime = Math.ceil(updates.wordCount / 200);
      }
      if (excerpt) updates.excerpt = excerpt;

      await article.update(updates);
      return sendSuccess(res, { message: 'Auto-saved', meta: { savedAt: new Date() } });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Auto-save failed' });
    }
  }

  async bulkAction(req, res) {
    try {
      const { ids, action } = req.body;
      switch (action) {
        case 'publish': await Article.update({ status: 'published', publishedAt: new Date() }, { where: { id: ids } }); break;
        case 'unpublish': await Article.update({ status: 'draft' }, { where: { id: ids } }); break;
        case 'archive': await Article.update({ status: 'archived' }, { where: { id: ids } }); break;
        case 'delete': await Article.destroy({ where: { id: ids } }); break;
        case 'feature': await Article.update({ isFeatured: true }, { where: { id: ids } }); break;
        case 'unfeature': await Article.update({ isFeatured: false }, { where: { id: ids } }); break;
        default: return sendError(res, { status: 400, message: `Unknown action: ${action}` });
      }

      return sendSuccess(res, { message: `Bulk ${action} completed on ${ids.length} article(s)` });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Bulk action failed' });
    }
  }

  async getRelated(req, res) {
    try {
      const { id } = req.params;
      const article = await Article.findByPk(id, { include: [{ model: Category, as: 'categories' }] });
      if (!article) return sendError(res, { status: 404, message: 'Article not found' });

      const categoryIds = article.categories.map(c => c.id);
      const relatedArticles = await Article.findAll({
        where: { id: { [Op.ne]: id }, status: 'published' },
        include: [
          { model: Category, as: 'categories', where: categoryIds.length > 0 ? { id: categoryIds } : undefined, required: categoryIds.length > 0 },
          { model: Media, as: 'featuredImage', attributes: ['url', 'thumbnailUrl', 'altText', 'caption'] },
          { model: User, as: 'author', attributes: ['username', 'avatar'] },
        ],
        order: [['publishedAt', 'DESC']],
        limit: 6,
      });

      return sendSuccess(res, { data: relatedArticles });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Failed to fetch related articles' });
    }
  }
}

module.exports = new ArticleController();
