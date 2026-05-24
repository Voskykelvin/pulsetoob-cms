const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Media = sequelize.define('Media', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  filename: { type: DataTypes.STRING, allowNull: false },
  originalName: { type: DataTypes.STRING, allowNull: false },
  mimeType: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('image', 'video', 'document', 'audio'), allowNull: false },
  size: { type: DataTypes.BIGINT, allowNull: false },
  width: { type: DataTypes.INTEGER, allowNull: true },
  height: { type: DataTypes.INTEGER, allowNull: true },
  duration: { type: DataTypes.FLOAT, allowNull: true },
  url: { type: DataTypes.STRING(500), allowNull: false },
  secureUrl: { type: DataTypes.STRING(500), allowNull: true },
  thumbnailUrl: { type: DataTypes.STRING(500), allowNull: true },
  thumbnailSmall: { type: DataTypes.STRING(500), allowNull: true },
  thumbnailMedium: { type: DataTypes.STRING(500), allowNull: true },
  thumbnailLarge: { type: DataTypes.STRING(500), allowNull: true },
  altText: { type: DataTypes.STRING(300), allowNull: true },
  caption: { type: DataTypes.TEXT, allowNull: true },
  title: { type: DataTypes.STRING(200), allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  metadata: { type: DataTypes.JSONB, defaultValue: {} },
  variants: { type: DataTypes.JSONB, defaultValue: {} },
  storage: { type: DataTypes.ENUM('local', 'cloudinary', 's3', 'gcs'), defaultValue: 'cloudinary' },
  storageId: { type: DataTypes.STRING, allowNull: true },
  folder: { type: DataTypes.STRING, defaultValue: 'uploads' },
  collection: { type: DataTypes.STRING(120), allowNull: true },
  focalPointX: { type: DataTypes.FLOAT, defaultValue: 0.5 },
  focalPointY: { type: DataTypes.FLOAT, defaultValue: 0.5 },
  needsAltText: { type: DataTypes.BOOLEAN, defaultValue: false },
  isPublic: { type: DataTypes.BOOLEAN, defaultValue: true },
  tags: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  usageCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  optimized: { type: DataTypes.BOOLEAN, defaultValue: false },
  uploadedById: { type: DataTypes.UUID, allowNull: false },
}, {
  timestamps: true,
  tableName: 'Media',
  indexes: [
    { fields: ['type'] },
    { fields: ['folder'] },
    { fields: ['collection'] },
    { fields: ['usageCount'] },
  ],
});

module.exports = Media;
