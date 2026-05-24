const { Sequelize } = require('sequelize');
require('dotenv').config();

const commonOptions = {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 20,
    min: 0,
    acquire: 60000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: false,
  },
};

const sslOptions = {
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
};

const databaseUrl = process.env.DATABASE_URL?.trim();

const requiredFallbackVars = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST'];
const missingFallbackVars = requiredFallbackVars.filter((key) => !process.env[key]);

if (!databaseUrl && missingFallbackVars.length > 0) {
  throw new Error(
    `Database configuration missing. Set DATABASE_URL or provide ${missingFallbackVars.join(', ')}.`
  );
}

const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, {
      ...commonOptions,
      ...sslOptions,
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        ...commonOptions,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        ...(process.env.DB_SSL === 'true' ? sslOptions : {}),
      }
    );

module.exports = sequelize;
