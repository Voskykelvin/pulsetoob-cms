const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Backlink = sequelize.define('Backlink', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  articleId: { type: DataTypes.UUID, allowNull: false },
  url: { type: DataTypes.STRING(500), allowNull: false },
  anchorText: { type: DataTypes.STRING(200), allowNull: false },
  targetUrl: { type: DataTypes.STRING(500), allowNull: true },
  type: { type: DataTypes.ENUM('internal', 'external', 'affiliate', 'sponsored'), defaultValue: 'external' },
  relationship: { type: DataTypes.ENUM('dofollow', 'nofollow', 'ugc', 'sponsored'), defaultValue: 'dofollow' },
  position: { type: DataTypes.ENUM('content', 'sidebar', 'footer', 'author_bio'), defaultValue: 'content' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  lastChecked: { type: DataTypes.DATE, allowNull: true },
  httpStatus: { type: DataTypes.INTEGER, allowNull: true },
  isBroken: { type: DataTypes.BOOLEAN, defaultValue: false },
  domainAuthority: { type: DataTypes.INTEGER, allowNull: true },
  referralTraffic: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  timestamps: true,
  tableName: 'Backlinks',
});

module.exports = Backlink;