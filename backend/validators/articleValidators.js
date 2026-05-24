const { body, param, query } = require('express-validator');

const ARTICLE_STATUSES = ['draft', 'published', 'scheduled', 'archived'];
const ARTICLE_TEMPLATES = ['default', 'featured', 'video'];
const BULK_ACTIONS = ['publish', 'unpublish', 'archive', 'delete', 'feature', 'unfeature'];
const SORT_FIELDS = ['createdAt', 'updatedAt', 'publishedAt', 'title', 'views', 'status'];

const uuidParam = (name = 'id') => param(name).isUUID().withMessage(`${name} must be a valid UUID`);

const optionalString = (field, max) => body(field)
  .optional({ nullable: true })
  .isString()
  .trim()
  .isLength({ max })
  .withMessage(`${field} must be ${max} characters or fewer`);

const optionalBoolean = (field) => body(field)
  .optional()
  .isBoolean()
  .withMessage(`${field} must be true or false`)
  .toBoolean();

const optionalStringArray = (field, maxItemLength = 80) => body(field)
  .optional()
  .isArray()
  .withMessage(`${field} must be an array`)
  .bail()
  .custom((items) => items.every((item) => typeof item === 'string' && item.trim().length > 0 && item.length <= maxItemLength))
  .withMessage(`${field} must contain non-empty strings of ${maxItemLength} characters or fewer`);

const optionalUuidArray = (field) => body(field)
  .optional()
  .isArray()
  .withMessage(`${field} must be an array`)
  .bail()
  .custom((items) => items.every((item) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item)))
  .withMessage(`${field} must contain valid UUIDs`);

const articleCreateRules = [
  body('title').isString().trim().isLength({ min: 3, max: 180 }).withMessage('title must be 3 to 180 characters'),
  body('content').optional({ nullable: true }).isString().withMessage('content must be text'),
  optionalString('excerpt', 320),
  optionalString('subtitle', 220),
  optionalUuidArray('categoryIds'),
  optionalStringArray('tagNames'),
  body('featuredImageId').optional({ nullable: true }).isUUID().withMessage('featuredImageId must be a valid UUID'),
  optionalString('videoUrl', 500).optional({ nullable: true }).isURL({ require_protocol: true }).withMessage('videoUrl must be a valid URL'),
  body('videoEmbed').optional({ nullable: true }).isString().withMessage('videoEmbed must be text'),
  optionalString('metaTitle', 70),
  optionalString('metaDescription', 170),
  optionalStringArray('metaKeywords', 60),
  optionalString('canonicalUrl', 500).optional({ nullable: true }).isURL({ require_protocol: true }).withMessage('canonicalUrl must be a valid URL'),
  optionalString('ogImage', 500),
  optionalString('ogTitle', 95),
  optionalString('ogDescription', 220),
  body('status').optional().isIn(ARTICLE_STATUSES).withMessage(`status must be one of: ${ARTICLE_STATUSES.join(', ')}`),
  body('scheduledFor').optional({ nullable: true }).isISO8601().withMessage('scheduledFor must be a valid date'),
  optionalBoolean('isFeatured'),
  optionalBoolean('isBreaking'),
  optionalBoolean('isPinned'),
  optionalBoolean('allowComments'),
  optionalBoolean('rssIncluded'),
  optionalBoolean('msnEligible'),
  body('template').optional().isIn(ARTICLE_TEMPLATES).withMessage(`template must be one of: ${ARTICLE_TEMPLATES.join(', ')}`),
];

const articleUpdateRules = [
  uuidParam(),
  body('title').optional().isString().trim().isLength({ min: 3, max: 180 }).withMessage('title must be 3 to 180 characters'),
  body('content').optional({ nullable: true }).isString().withMessage('content must be text'),
  optionalString('excerpt', 320),
  optionalString('subtitle', 220),
  optionalUuidArray('categoryIds'),
  optionalStringArray('tagNames'),
  body('featuredImageId').optional({ nullable: true }).isUUID().withMessage('featuredImageId must be a valid UUID'),
  optionalString('videoUrl', 500).optional({ nullable: true }).isURL({ require_protocol: true }).withMessage('videoUrl must be a valid URL'),
  body('videoEmbed').optional({ nullable: true }).isString().withMessage('videoEmbed must be text'),
  optionalString('metaTitle', 70),
  optionalString('metaDescription', 170),
  optionalStringArray('metaKeywords', 60),
  optionalString('canonicalUrl', 500).optional({ nullable: true }).isURL({ require_protocol: true }).withMessage('canonicalUrl must be a valid URL'),
  optionalString('ogImage', 500),
  optionalString('ogTitle', 95),
  optionalString('ogDescription', 220),
  body('status').optional().isIn(ARTICLE_STATUSES).withMessage(`status must be one of: ${ARTICLE_STATUSES.join(', ')}`),
  body('scheduledFor').optional({ nullable: true }).isISO8601().withMessage('scheduledFor must be a valid date'),
  optionalBoolean('isFeatured'),
  optionalBoolean('isBreaking'),
  optionalBoolean('isPinned'),
  optionalBoolean('allowComments'),
  optionalBoolean('rssIncluded'),
  optionalBoolean('msnEligible'),
  body('template').optional().isIn(ARTICLE_TEMPLATES).withMessage(`template must be one of: ${ARTICLE_TEMPLATES.join(', ')}`),
];

const articleListRules = [
  query('page').optional().isInt({ min: 1 }).toInt().withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('limit must be between 1 and 100'),
  query('status').optional().isIn(ARTICLE_STATUSES).withMessage(`status must be one of: ${ARTICLE_STATUSES.join(', ')}`),
  query('sortBy').optional().isIn(SORT_FIELDS).withMessage(`sortBy must be one of: ${SORT_FIELDS.join(', ')}`),
  query('sortOrder').optional().isIn(['ASC', 'DESC', 'asc', 'desc']).withMessage('sortOrder must be ASC or DESC'),
  query('featured').optional().isIn(['true', 'false']).withMessage('featured must be true or false'),
  query('breaking').optional().isIn(['true', 'false']).withMessage('breaking must be true or false'),
];

const scheduleRules = [
  uuidParam(),
  body('scheduledFor').isISO8601().withMessage('scheduledFor must be a valid date'),
];

const autoSaveRules = [
  uuidParam(),
  body('title').optional().isString().trim().isLength({ min: 3, max: 180 }).withMessage('title must be 3 to 180 characters'),
  body('content').optional().isString().withMessage('content must be text'),
  optionalString('excerpt', 320),
];

const bulkActionRules = [
  body('ids').isArray({ min: 1 }).withMessage('ids must be a non-empty array'),
  body('ids.*').isUUID().withMessage('each id must be a valid UUID'),
  body('action').isIn(BULK_ACTIONS).withMessage(`action must be one of: ${BULK_ACTIONS.join(', ')}`),
];

module.exports = {
  articleCreateRules,
  articleUpdateRules,
  articleListRules,
  scheduleRules,
  autoSaveRules,
  bulkActionRules,
  uuidParam,
  SORT_FIELDS,
};
