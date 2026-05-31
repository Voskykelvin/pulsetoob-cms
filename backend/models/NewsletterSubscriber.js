const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NewsletterSubscriber = sequelize.define('NewsletterSubscriber', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  email: {
    type: DataTypes.STRING(320),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  source: { type: DataTypes.STRING(120), allowNull: true },
  status: {
    type: DataTypes.ENUM('active', 'unsubscribed'),
    defaultValue: 'active',
  },
  metadata: { type: DataTypes.JSONB, defaultValue: {} },
}, {
  timestamps: true,
  tableName: 'NewsletterSubscribers',
});

module.exports = NewsletterSubscriber;
