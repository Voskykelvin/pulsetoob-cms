const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  icon: { type: DataTypes.STRING(50), allowNull: true },
  color: { type: DataTypes.STRING(7), allowNull: true, defaultValue: '#22c55e' },
  coverImage: { type: DataTypes.JSONB, defaultValue: { url: null, thumbnailUrl: null } },
  parentId: { type: DataTypes.UUID, allowNull: true },
  order: { type: DataTypes.INTEGER, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  isFeatured: { type: DataTypes.BOOLEAN, defaultValue: false },
  showInNav: { type: DataTypes.BOOLEAN, defaultValue: true },
  showInFooter: { type: DataTypes.BOOLEAN, defaultValue: false },
  showInSidebar: { type: DataTypes.BOOLEAN, defaultValue: true },
  articleCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  metaTitle: { type: DataTypes.STRING(70), allowNull: true },
  metaDescription: { type: DataTypes.STRING(160), allowNull: true },
  metaKeywords: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  rssEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
  msnEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  layout: { type: DataTypes.ENUM('grid', 'list', 'magazine', 'masonry'), defaultValue: 'grid' },
  postsPerPage: { type: DataTypes.INTEGER, defaultValue: 12 },
}, {
  timestamps: true,
  tableName: 'Categories',
  indexes: [
    { fields: ['slug'], unique: true },
    { fields: ['parentId'] },
    { fields: ['isActive'] },
  ],
});

module.exports = Category;