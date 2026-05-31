const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Setting = sequelize.define('Setting', {
  name: { type: DataTypes.STRING(80), allowNull: false, primaryKey: true },
  value: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
}, {
  timestamps: true,
  tableName: 'Settings',
});

module.exports = Setting;
