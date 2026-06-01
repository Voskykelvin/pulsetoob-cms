const { Sequelize } = require('sequelize');
require('dotenv').config();

const DEFAULT_CONNECTION_TIMEOUT_MS = 10000;
const parsedConnectionTimeoutMs = Number.parseInt(
  process.env.DB_CONNECTION_TIMEOUT_MS || String(DEFAULT_CONNECTION_TIMEOUT_MS),
  10
);
const connectionTimeoutMs = Number.isFinite(parsedConnectionTimeoutMs) && parsedConnectionTimeoutMs > 0
  ? parsedConnectionTimeoutMs
  : DEFAULT_CONNECTION_TIMEOUT_MS;
const parsedPoolMax = Number.parseInt(process.env.DB_POOL_MAX || '20', 10);
const poolMax = Number.isFinite(parsedPoolMax) && parsedPoolMax > 0 ? parsedPoolMax : 20;

const commonOptions = {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: poolMax,
    min: 0,
    acquire: 60000,
    idle: 10000,
  },
  dialectOptions: {
    connectTimeout: connectionTimeoutMs,
    connectionTimeoutMillis: connectionTimeoutMs,
  },
  define: {
    timestamps: true,
    underscored: false,
  },
};

function buildOptions({ ssl = false } = {}) {
  return {
    ...commonOptions,
    dialectOptions: {
      ...commonOptions.dialectOptions,
      ...(ssl
        ? {
            ssl: {
              require: true,
              rejectUnauthorized: false,
            },
          }
        : {}),
    },
  };
}

const databaseUrl = process.env.DATABASE_URL?.trim();
const hasValidDatabaseUrl = databaseUrl && /^(postgres|postgresql):\/\//.test(databaseUrl);

const requiredFallbackVars = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST'];
const missingFallbackVars = requiredFallbackVars.filter((key) => !process.env[key]);

if (databaseUrl && !hasValidDatabaseUrl) {
  throw new Error('DATABASE_URL must start with postgres:// or postgresql://.');
}

if (!databaseUrl && missingFallbackVars.length > 0) {
  throw new Error(
    `Database configuration missing. Set DATABASE_URL or provide ${missingFallbackVars.join(', ')}.`
  );
}

const sequelize = hasValidDatabaseUrl
  ? new Sequelize(databaseUrl, buildOptions({ ssl: true }))
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        ...buildOptions({ ssl: process.env.DB_SSL === 'true' }),
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
      }
    );

module.exports = sequelize;
