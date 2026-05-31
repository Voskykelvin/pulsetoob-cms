const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContactMessage = sequelize.define('ContactMessage', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(160), allowNull: false },
  email: {
    type: DataTypes.STRING(320),
    allowNull: false,
    validate: { isEmail: true },
  },
  topic: {
    type: DataTypes.ENUM('collaboration', 'advertising', 'correction', 'story_tip', 'general'),
    defaultValue: 'general',
  },
  subject: { type: DataTypes.STRING(180), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  consent: { type: DataTypes.BOOLEAN, defaultValue: false },
  status: {
    type: DataTypes.ENUM('new', 'reviewed', 'archived'),
    defaultValue: 'new',
  },
  metadata: { type: DataTypes.JSONB, defaultValue: {} },
}, {
  timestamps: true,
  tableName: 'ContactMessages',
});

module.exports = ContactMessage;
