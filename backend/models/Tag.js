const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tag = sequelize.define('Tag', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  slug: { type: DataTypes.STRING(60), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  articleCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  color: { type: DataTypes.STRING(7), allowNull: true },
}, {
  timestamps: true,
  tableName: 'Tags',
});

module.exports = Tag;