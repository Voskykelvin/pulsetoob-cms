const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Comment = sequelize.define('Comment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  articleId: { type: DataTypes.UUID, allowNull: false },
  userId: { type: DataTypes.UUID, allowNull: true },
  parentId: { type: DataTypes.UUID, allowNull: true },
  authorName: { type: DataTypes.STRING(100), allowNull: false },
  authorEmail: { type: DataTypes.STRING, allowNull: true },
  content: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'approved', 'spam', 'trash'), defaultValue: 'pending' },
  likes: { type: DataTypes.INTEGER, defaultValue: 0 },
  ipAddress: { type: DataTypes.STRING(45), allowNull: true },
}, {
  timestamps: true,
  tableName: 'Comments',
});

module.exports = Comment;