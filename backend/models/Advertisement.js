const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Advertisement = sequelize.define('Advertisement', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING(160), allowNull: false },
  imageUrl: { type: DataTypes.STRING(1000), allowNull: false },
  targetUrl: { type: DataTypes.STRING(1000), allowNull: false, validate: { isUrl: true } },
  slot: {
    type: DataTypes.ENUM('header_leaderboard', 'sidebar_square', 'in_article_banner'),
    allowNull: false,
  },
  sponsorName: { type: DataTypes.STRING(160), allowNull: true },
  impressions: { type: DataTypes.INTEGER, defaultValue: 0 },
  clicks: { type: DataTypes.INTEGER, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  startDate: { type: DataTypes.DATE, allowNull: true },
  endDate: { type: DataTypes.DATE, allowNull: true },
}, {
  timestamps: true,
  indexes: [
    { fields: ['slot', 'isActive'] },
    { fields: ['startDate'] },
    { fields: ['endDate'] },
  ],
});

module.exports = Advertisement;
