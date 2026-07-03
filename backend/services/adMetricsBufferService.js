const { Advertisement } = require('../models');

function getPositiveIntegerEnv(name, fallback) {
  const value = Number.parseInt(process.env[name] || String(fallback), 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

class AdMetricsBufferService {
  constructor() {
    this.enabled = process.env.AD_METRICS_QUEUE_ENABLED !== 'false';
    this.flushIntervalMs = getPositiveIntegerEnv('AD_METRICS_FLUSH_INTERVAL_MS', 5000);
    this.maxTrackedAds = getPositiveIntegerEnv('AD_METRICS_QUEUE_MAX', 1000);
    this.impressions = new Map();
    this.clicks = new Map();
    this.flushing = false;
    this.droppedMetrics = 0;

    this.timer = setInterval(() => {
      this.flush().catch((error) => {
        console.error('Ad metrics buffer flush failed:', error);
      });
    }, this.flushIntervalMs);
    this.timer.unref?.();
  }

  track(id, metric) {
    if (!this.enabled) {
      Advertisement.increment(metric, { where: { id } }).catch((error) => {
        console.error(`Ad ${metric} direct increment failed:`, error);
      });
      return { queued: false, direct: true };
    }

    const target = metric === 'clicks' ? this.clicks : this.impressions;
    if (target.size >= this.maxTrackedAds && !target.has(id)) {
      this.droppedMetrics += 1;
      return { queued: false, dropped: true };
    }

    target.set(id, (target.get(id) || 0) + 1);
    return { queued: true };
  }

  trackImpression(id) {
    return this.track(id, 'impressions');
  }

  trackClick(id) {
    return this.track(id, 'clicks');
  }

  async flushMetric(metric, map) {
    const entries = Array.from(map.entries());
    map.clear();

    await Promise.all(
      entries.map(([id, count]) => Advertisement.increment(metric, { by: count, where: { id } }))
    );
  }

  async flush() {
    if (this.flushing) return;
    this.flushing = true;

    try {
      await Promise.all([
        this.flushMetric('impressions', this.impressions),
        this.flushMetric('clicks', this.clicks),
      ]);
    } finally {
      this.flushing = false;
    }
  }

  async flushAll() {
    while (this.impressions.size > 0 || this.clicks.size > 0) {
      await this.flush();
    }
  }

  getStats() {
    return {
      enabled: this.enabled,
      impressionBacklog: this.impressions.size,
      clickBacklog: this.clicks.size,
      droppedMetrics: this.droppedMetrics,
    };
  }
}

module.exports = new AdMetricsBufferService();
