const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Analytics = sequelize.define('Analytics', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  articleId: { type: DataTypes.UUID, allowNull: true },
  eventType: { type: DataTypes.ENUM('page_view', 'article_view', 'share', 'click', 'scroll', 'time_on_page', 'bounce'), allowNull: false },
  sessionId: { type: DataTypes.STRING, allowNull: true },
  visitorId: { type: DataTypes.STRING, allowNull: true },
  source: { type: DataTypes.STRING, allowNull: true },
  medium: { type: DataTypes.STRING, allowNull: true },
  referrer: { type: DataTypes.STRING(500), allowNull: true },
  userAgent: { type: DataTypes.TEXT, allowNull: true },
  device: { type: DataTypes.ENUM('desktop', 'mobile', 'tablet'), allowNull: true },
  browser: { type: DataTypes.STRING, allowNull: true },
  os: { type: DataTypes.STRING, allowNull: true },
  country: { type: DataTypes.STRING(2), allowNull: true },
  city: { type: DataTypes.STRING, allowNull: true },
  ipAddress: { type: DataTypes.STRING(45), allowNull: true },
  metadata: { type: DataTypes.JSONB, defaultValue: {} },
  duration: { type: DataTypes.INTEGER, allowNull: true },
}, {
  timestamps: true,
  tableName: 'Analytics',
});

module.exports = Analytics;