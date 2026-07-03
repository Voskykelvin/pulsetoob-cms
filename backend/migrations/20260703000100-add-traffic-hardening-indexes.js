module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addIndex('Analytics', ['eventType', 'createdAt'], {
      name: 'analytics_event_type_created_at_idx',
    });
    await queryInterface.addIndex('Analytics', ['articleId', 'eventType', 'createdAt'], {
      name: 'analytics_article_event_created_at_idx',
    });
    await queryInterface.addIndex('Analytics', ['visitorId', 'createdAt'], {
      name: 'analytics_visitor_created_at_idx',
    });
    await queryInterface.addIndex('Analytics', ['sessionId', 'createdAt'], {
      name: 'analytics_session_created_at_idx',
    });
    await queryInterface.addIndex('Articles', ['status', 'publishedAt'], {
      name: 'articles_status_published_at_idx',
    });
    await queryInterface.addIndex('Articles', ['status', 'isFeatured', 'publishedAt'], {
      name: 'articles_status_featured_published_at_idx',
    });
    await queryInterface.addIndex('Articles', ['status', 'isPinned', 'publishedAt'], {
      name: 'articles_status_pinned_published_at_idx',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('Articles', 'articles_status_pinned_published_at_idx');
    await queryInterface.removeIndex('Articles', 'articles_status_featured_published_at_idx');
    await queryInterface.removeIndex('Articles', 'articles_status_published_at_idx');
    await queryInterface.removeIndex('Analytics', 'analytics_session_created_at_idx');
    await queryInterface.removeIndex('Analytics', 'analytics_visitor_created_at_idx');
    await queryInterface.removeIndex('Analytics', 'analytics_article_event_created_at_idx');
    await queryInterface.removeIndex('Analytics', 'analytics_event_type_created_at_idx');
  },
};
