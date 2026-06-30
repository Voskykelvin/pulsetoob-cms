const { Category, Article, sequelize } = require('../models');
const { Op } = require('sequelize');
const slugify = require('slugify');

async function getCategoryArticleCount(categoryId) {
  return Article.count({
    include: [{
      model: Category,
      as: 'categories',
      where: { id: categoryId },
      attributes: [],
      through: { attributes: [] },
    }],
  });
}

async function attachArticleCounts(categories) {
  for (const category of categories) {
    category.setDataValue('articleCount', await getCategoryArticleCount(category.id));

    const subcategories = category.subcategories || [];
    if (subcategories.length > 0) {
      await attachArticleCounts(subcategories);
    }
  }
}

class CategoryController {
  async getAllCategories(req, res) {
    try {
      const { flat, active, featured } = req.query;
      const where = {};
      if (active === 'true') where.isActive = true;
      if (featured === 'true') where.isFeatured = true;

      let categories;
      if (flat === 'true') {
        categories = await Category.findAll({ where, order: [['order', 'ASC'], ['name', 'ASC']] });
      } else {
        const childWhere = active === 'true' ? { isActive: true } : undefined;
        categories = await Category.findAll({
          where: { ...where, parentId: null },
          order: [['order', 'ASC'], ['name', 'ASC']],
          include: [{
            model: Category, as: 'subcategories',
            where: childWhere,
            required: false,
            include: [{ model: Category, as: 'subcategories', where: childWhere, required: false }],
          }],
        });
      }

      await attachArticleCounts(categories);

      res.json({ success: true, data: categories, total: categories.length });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  }

  async getCategoryBySlug(req, res) {
    try {
      const { slug } = req.params;
      const { page = 1, limit = 12 } = req.query;

      const category = await Category.findOne({
        where: { slug, isActive: true },
        include: [
          { model: Category, as: 'subcategories', where: { isActive: true }, required: false },
          { model: Category, as: 'parent', required: false },
        ],
      });

      if (!category) return res.status(404).json({ error: 'Category not found' });

      const offset = (page - 1) * limit;
      const articles = await Article.findAndCountAll({
        include: [{ model: Category, as: 'categories', where: { id: category.id }, attributes: [] }],
        where: { status: 'published' },
        order: [['publishedAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      res.json({
        success: true,
        data: {
          category,
          articles: articles.rows,
          pagination: {
            total: articles.count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(articles.count / limit),
          },
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch category' });
    }
  }

  async createCategory(req, res) {
    try {
      const { name, description, icon, color, parentId, order, showInNav,
        showInFooter, showInSidebar, isActive, isFeatured, layout, postsPerPage,
        metaTitle, metaDescription, metaKeywords, rssEnabled, msnEnabled } = req.body;

      let slug = slugify(name, { lower: true, strict: true });
      const existingSlug = await Category.findOne({ where: { slug } });
      if (existingSlug) slug = `${slug}-${Date.now()}`;

      if (parentId) {
        const parent = await Category.findByPk(parentId);
        if (!parent) return res.status(400).json({ error: 'Parent category not found' });
      }

      const category = await Category.create({
        name, slug, description, icon,
        color: color || '#22c55e',
        parentId: parentId || null,
        order: order || 0,
        isActive: isActive !== false,
        showInNav: showInNav !== false,
        showInFooter: showInFooter || false,
        showInSidebar: showInSidebar !== false,
        isFeatured: isFeatured || false,
        layout: layout || 'grid',
        postsPerPage: postsPerPage || 12,
        metaTitle: metaTitle || name,
        metaDescription: metaDescription || description,
        metaKeywords: metaKeywords || [],
        rssEnabled: rssEnabled !== false,
        msnEnabled: msnEnabled || false,
      });

      res.status(201).json({ success: true, data: category, message: 'Category created successfully' });
    } catch (error) {
      console.error('Create category error:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ error: 'Category name already exists' });
      }
      res.status(500).json({ error: 'Failed to create category' });
    }
  }

  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const category = await Category.findByPk(id);
      if (!category) return res.status(404).json({ error: 'Category not found' });

      const updates = req.body;
      if (updates.name && updates.name !== category.name) {
        let slug = slugify(updates.name, { lower: true, strict: true });
        const existingSlug = await Category.findOne({ where: { slug, id: { [Op.ne]: id } } });
        if (existingSlug) slug = `${slug}-${Date.now()}`;
        updates.slug = slug;
      }

      if (updates.parentId === id) {
        return res.status(400).json({ error: 'Category cannot be its own parent' });
      }

      await category.update(updates);
      res.json({ success: true, data: category, message: 'Category updated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update category' });
    }
  }

  async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      const { reassignTo } = req.body;

      const category = await Category.findByPk(id);
      if (!category) return res.status(404).json({ error: 'Category not found' });

      await Category.update({ parentId: reassignTo || null }, { where: { parentId: id } });
      await category.destroy();

      res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete category' });
    }
  }

  async reorderCategories(req, res) {
    try {
      const { orderedIds } = req.body;
      if (!Array.isArray(orderedIds)) {
        return res.status(400).json({ error: 'orderedIds must be an array' });
      }

      const transaction = await sequelize.transaction();
      try {
        for (let i = 0; i < orderedIds.length; i++) {
          await Category.update({ order: i }, { where: { id: orderedIds[i] }, transaction });
        }
        await transaction.commit();
        res.json({ success: true, message: 'Categories reordered successfully' });
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to reorder categories' });
    }
  }

  async getCategoryStats(req, res) {
    try {
      const categories = await Category.findAll({
        attributes: ['id', 'name', 'slug', 'color', 'icon', 'articleCount'],
        where: { isActive: true },
        order: [['articleCount', 'DESC']],
      });
      await attachArticleCounts(categories);
      categories.sort((a, b) => b.articleCount - a.articleCount);
      res.json({ success: true, data: categories });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch category stats' });
    }
  }

  async bulkUpdateCategories(req, res) {
    try {
      const { operations } = req.body;
      const transaction = await sequelize.transaction();
      try {
        const results = [];
        for (const op of operations) {
          switch (op.action) {
            case 'activate':
              await Category.update({ isActive: true }, { where: { id: op.ids }, transaction });
              break;
            case 'deactivate':
              await Category.update({ isActive: false }, { where: { id: op.ids }, transaction });
              break;
            case 'feature':
              await Category.update({ isFeatured: true }, { where: { id: op.ids }, transaction });
              break;
            case 'unfeature':
              await Category.update({ isFeatured: false }, { where: { id: op.ids }, transaction });
              break;
          }
          results.push({ action: op.action, count: op.ids.length });
        }
        await transaction.commit();
        res.json({ success: true, results });
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      res.status(500).json({ error: 'Bulk operation failed' });
    }
  }
}

module.exports = new CategoryController();
