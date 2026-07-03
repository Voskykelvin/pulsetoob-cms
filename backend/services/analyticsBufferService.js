const { Analytics, Article } = require('../models');

function getPositiveIntegerEnv(name, fallback) {
  const value = Number.parseInt(process.env[name] || String(fallback), 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getRateEnv(name, fallback) {
  const value = Number.parseFloat(process.env[name] || String(fallback));
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(1, value));
}

class AnalyticsBufferService {
  constructor() {
    this.enabled = process.env.ANALYTICS_QUEUE_ENABLED !== 'false';
    this.sampleRate = getRateEnv('ANALYTICS_SAMPLE_RATE', 1);
    this.maxQueueSize = getPositiveIntegerEnv('ANALYTICS_QUEUE_MAX', 5000);
    this.flushIntervalMs = getPositiveIntegerEnv('ANALYTICS_FLUSH_INTERVAL_MS', 5000);
    this.batchSize = getPositiveIntegerEnv('ANALYTICS_FLUSH_BATCH_SIZE', 250);
    this.queue = [];
    this.articleViewCounts = new Map();
    this.flushing = false;
    this.droppedEvents = 0;
    this.droppedArticleViews = 0;

    this.timer = setInterval(() => {
      this.flush().catch((error) => {
        console.error('Analytics buffer flush failed:', error);
      });
    }, this.flushIntervalMs);
    this.timer.unref?.();
  }

  enqueue(event) {
    if (event.eventType === 'article_view' && event.articleId) {
      this.enqueueArticleView(event.articleId);
    }

    if (!this.enabled) {
      Analytics.create(event).catch((error) => {
        console.error('Analytics direct write failed:', error);
      });
      return { queued: false, direct: true };
    }

    if (Math.random() > this.sampleRate) {
      return { queued: false, sampled: true };
    }

    if (this.queue.length >= this.maxQueueSize) {
      this.droppedEvents += 1;
      return { queued: false, dropped: true };
    }

    this.queue.push(event);
    return { queued: true };
  }

  enqueueArticleView(articleId) {
    if (this.articleViewCounts.size >= this.maxQueueSize && !this.articleViewCounts.has(articleId)) {
      this.droppedArticleViews += 1;
      return;
    }

    this.articleViewCounts.set(articleId, (this.articleViewCounts.get(articleId) || 0) + 1);
  }

  async flush() {
    if (this.flushing) return;
    this.flushing = true;

    try {
      const events = this.queue.splice(0, this.batchSize);
      if (events.length > 0) {
        await Analytics.bulkCreate(events, { validate: false });
      }

      const articleCounts = Array.from(this.articleViewCounts.entries()).slice(0, this.batchSize);
      for (const [articleId] of articleCounts) {
        this.articleViewCounts.delete(articleId);
      }

      await Promise.all(
        articleCounts.map(([articleId, count]) => (
          Article.increment('views', { by: count, where: { id: articleId } })
        ))
      );
    } catch (error) {
      this.droppedEvents += this.queue.length;
      this.queue = [];
      this.articleViewCounts.clear();
      throw error;
    } finally {
      this.flushing = false;
    }
  }

  async flushAll() {
    while (this.queue.length > 0 || this.articleViewCounts.size > 0) {
      await this.flush();
    }
  }

  getStats() {
    return {
      enabled: this.enabled,
      sampleRate: this.sampleRate,
      queueLength: this.queue.length,
      articleViewBacklog: this.articleViewCounts.size,
      droppedEvents: this.droppedEvents,
      droppedArticleViews: this.droppedArticleViews,
    };
  }
}

module.exports = new AnalyticsBufferService();
