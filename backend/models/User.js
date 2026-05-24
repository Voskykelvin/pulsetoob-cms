const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  password: { type: DataTypes.STRING, allowNull: false },
  firstName: { type: DataTypes.STRING(100), allowNull: true },
  lastName: { type: DataTypes.STRING(100), allowNull: true },
  avatar: { type: DataTypes.JSONB, defaultValue: { url: null, thumbnailUrl: null } },
  bio: { type: DataTypes.TEXT, allowNull: true },
  role: { type: DataTypes.ENUM('super_admin', 'admin', 'editor', 'author', 'contributor', 'subscriber'), defaultValue: 'author' },
  permissions: {
    type: DataTypes.JSONB,
    defaultValue: {
      canPublish: true, canEdit: true, canDelete: false,
      canManageUsers: false, canManageSettings: false,
      canManageCategories: false, canManageMedia: true, canViewAnalytics: true,
    },
  },
  socialLinks: {
    type: DataTypes.JSONB,
    defaultValue: { twitter: null, linkedin: null, facebook: null, instagram: null, website: null },
  },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  lastLogin: { type: DataTypes.DATE, allowNull: true },
  preferences: {
    type: DataTypes.JSONB,
    defaultValue: {
      editorMode: 'rich', theme: 'system',
      notifications: { email: true, push: true, comments: true, mentions: true },
      autoSave: true, autoSaveInterval: 30000,
    },
  },
  twoFactorEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  twoFactorSecret: { type: DataTypes.STRING, allowNull: true },
  apiKey: { type: DataTypes.STRING, allowNull: true, unique: true },
  refreshToken: { type: DataTypes.STRING, allowNull: true },
  passwordResetToken: { type: DataTypes.STRING, allowNull: true },
  passwordResetExpires: { type: DataTypes.DATE, allowNull: true },
  emailVerificationToken: { type: DataTypes.STRING, allowNull: true },
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) user.password = await bcrypt.hash(user.password, 12);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) user.password = await bcrypt.hash(user.password, 12);
    },
  },
  defaultScope: {
    attributes: { exclude: ['password', 'twoFactorSecret', 'refreshToken', 'passwordResetToken'] },
  },
  scopes: {
    withPassword: { attributes: { include: ['password'] } },
  },
});

User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  delete values.twoFactorSecret;
  delete values.refreshToken;
  delete values.passwordResetToken;
  return values;
};

module.exports = User;