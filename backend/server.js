require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const { sequelize } = require('./models');
const schedulerService = require('./services/schedulerService');
const authRoutes = require('./routes/auth');
const articleRoutes = require('./routes/articles');
const categoryRoutes = require('./routes/categories');
const mediaRoutes = require('./routes/media');
const seoRoutes = require('./routes/seo');
const rssRoutes = require('./routes/rss');
const msnRoutes = require('./routes/msn');
const backlinkRoutes = require('./routes/backlinks');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');
const adRoutes = require('./routes/ads');
const publicRoutes = require('./routes/public');

const app = express();
const startedAt = new Date();
const dbState = {
  ready: false,
  initializing: false,
  initializedAt: null,
  lastCheckedAt: null,
  lastError: null,
};

function getPositiveIntegerEnv(name, fallback) {
  const value = Number.parseInt(process.env[name] || String(fallback), 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

const DB_INIT_TIMEOUT_MS = getPositiveIntegerEnv('DB_INIT_TIMEOUT_MS', 30000);
const DB_RETRY_DELAY_MS = getPositiveIntegerEnv('DB_RETRY_DELAY_MS', 15000);

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout(promise, timeoutMs, label) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

function getHealthPayload() {
  return {
    status: 'OK',
    uptime: Math.round(process.uptime()),
    startedAt: startedAt.toISOString(),
    timestamp: new Date().toISOString(),
    database: dbState.ready ? 'ready' : 'initializing',
    databaseCheckedAt: dbState.lastCheckedAt,
  };
}

function getReadyPayload() {
  return {
    status: dbState.ready ? 'READY' : 'NOT_READY',
    timestamp: new Date().toISOString(),
    database: dbState.ready ? 'ready' : 'unavailable',
    initializedAt: dbState.initializedAt,
    lastDatabaseError: dbState.lastError,
  };
}

app.get('/health', (req, res) => res.json(getHealthPayload()));
app.get('/ready', (req, res) => {
  if (!dbState.ready) {
    return res.status(503).json(getReadyPayload());
  }

  return res.json(getReadyPayload());
});

app.set('trust proxy', 1);
app.use(helmet());
const rateLimitHandler = (code, message) => (req, res, next, options) => {
  return res.status(options.statusCode).json({
    success: false,
    error: message,
    code,
  });
};
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === '/ready',
  handler: rateLimitHandler('RATE_LIMITED', 'Too many requests. Please try again shortly.'),
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('AUTH_RATE_LIMITED', 'Too many sign-in attempts. Please try again in a few minutes.'),
});
app.use(generalLimiter);
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const allowedOrigins = [
  'https://pulsetoob.com',
  'https://www.pulsetoob.com',
  'https://pulsetoob-cms-of3z.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map((origin) => origin.trim()) : []),
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
}));

app.use('/uploads', express.static('uploads'));
app.use('/api', (req, res, next) => {
  if (dbState.ready) return next();

  return res
    .status(503)
    .set('Retry-After', '15')
    .json({
      success: false,
      error: 'Service temporarily unavailable',
      code: 'DATABASE_NOT_READY',
      details: 'The API is online but the database connection is still initializing.',
    });
});
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/rss', rssRoutes);
app.use('/api/msn', msnRoutes);
app.use('/api/backlinks', backlinkRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/public', publicRoutes);

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => res.status(err.statusCode || 500).json({ error: { message: err.message || 'Internal Server Error' } }));

cron.schedule('* * * * *', async () => {
  if (!dbState.ready) return;

  try {
    await schedulerService.publishScheduledArticles();
  } catch (error) {
    console.error('Scheduled article publish failed:', error);
  }
});

const PORT = process.env.PORT || 5000;

const initializeDatabase = async () => {
  if (dbState.initializing || dbState.ready) return;
  dbState.initializing = true;

  while (!dbState.ready) {
    try {
      dbState.lastCheckedAt = new Date().toISOString();
      await withTimeout(sequelize.authenticate(), DB_INIT_TIMEOUT_MS, 'Database authentication');
      console.log('Database connected successfully');

      const syncOptions = process.env.DB_SYNC_ALTER === 'true' ? { alter: true } : {};
      await withTimeout(sequelize.sync(syncOptions), DB_INIT_TIMEOUT_MS, 'Database sync');
      console.log(process.env.DB_SYNC_ALTER === 'true' ? 'Database synced with alter' : 'Database synced');

      dbState.ready = true;
      dbState.initializedAt = new Date().toISOString();
      dbState.lastError = null;
    } catch (error) {
      dbState.ready = false;
      dbState.lastError = error.message;
      console.error('Database initialization failed:', error);
      await delay(DB_RETRY_DELAY_MS);
    }
  }
};

const startServer = () => {
  app.listen(PORT, () => {
    console.log('PulseToob Server running on port ' + PORT);
    initializeDatabase();
  });
};

startServer();

module.exports = app;
