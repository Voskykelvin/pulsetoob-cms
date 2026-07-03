const sequelize = require('../config/database');

const INDEX_QUERIES = [
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS "analytics_event_type_created_at_idx" ON "Analytics" ("eventType", "createdAt");',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS "analytics_article_event_created_at_idx" ON "Analytics" ("articleId", "eventType", "createdAt");',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS "analytics_visitor_created_at_idx" ON "Analytics" ("visitorId", "createdAt");',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS "analytics_session_created_at_idx" ON "Analytics" ("sessionId", "createdAt");',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS "articles_status_published_at_idx" ON "Articles" ("status", "publishedAt");',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS "articles_status_featured_published_at_idx" ON "Articles" ("status", "isFeatured", "publishedAt");',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS "articles_status_pinned_published_at_idx" ON "Articles" ("status", "isPinned", "publishedAt");',
];

class TrafficIndexService {
  async ensureIndexes() {
    if (process.env.SKIP_TRAFFIC_INDEX_ENSURE === 'true') return;

    for (const query of INDEX_QUERIES) {
      await sequelize.query(query);
    }
  }
}

module.exports = new TrafficIndexService();
