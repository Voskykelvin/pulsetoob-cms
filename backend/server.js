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

const app = express();

app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));

app.use('/uploads', express.static('uploads'));
app.use('/api/auth', authRoutes);
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

app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => res.status(err.statusCode || 500).json({ error: { message: err.message || 'Internal Server Error' } }));

cron.schedule('* * * * *', async () => {
  await schedulerService.publishScheduledArticles();
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');
    await sequelize.sync({ alter: true });
    console.log('Database synced');
    app.listen(PORT, () => {
      console.log('PulseToob Server running on port ' + PORT);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
