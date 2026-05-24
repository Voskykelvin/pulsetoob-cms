const { body, param, query } = require('express-validator');

const mediaListRules = [
  query('page').optional().isInt({ min: 1 }).toInt().withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('limit must be between 1 and 100'),
  query('type').optional().isIn(['image', 'video', 'document', 'audio']).withMessage('type is invalid'),
  query('folder').optional().isString().trim().isLength({ max: 120 }).withMessage('folder must be 120 characters or fewer'),
  query('collection').optional().isString().trim().isLength({ max: 120 }).withMessage('collection must be 120 characters or fewer'),
  query('unused').optional().isIn(['true', 'false']).withMessage('unused must be true or false'),
];

const mediaIdRules = [
  param('id').isUUID().withMessage('id must be a valid UUID'),
];

const updateMediaRules = [
  ...mediaIdRules,
  body('altText').optional({ nullable: true }).isString().trim().isLength({ max: 300 }).withMessage('altText must be 300 characters or fewer'),
  body('caption').optional({ nullable: true }).isString().trim().isLength({ max: 2000 }).withMessage('caption must be 2000 characters or fewer'),
  body('title').optional({ nullable: true }).isString().trim().isLength({ max: 200 }).withMessage('title must be 200 characters or fewer'),
  body('description').optional({ nullable: true }).isString().trim().isLength({ max: 4000 }).withMessage('description must be 4000 characters or fewer'),
  body('folder').optional().isString().trim().isLength({ min: 1, max: 120 }).withMessage('folder must be 1 to 120 characters'),
  body('collection').optional({ nullable: true }).isString().trim().isLength({ max: 120 }).withMessage('collection must be 120 characters or fewer'),
  body('focalPointX').optional().isFloat({ min: 0, max: 1 }).toFloat().withMessage('focalPointX must be between 0 and 1'),
  body('focalPointY').optional().isFloat({ min: 0, max: 1 }).toFloat().withMessage('focalPointY must be between 0 and 1'),
  body('tags').optional().custom((value) => Array.isArray(value) || typeof value === 'string').withMessage('tags must be an array or comma-separated string'),
];

module.exports = { mediaListRules, mediaIdRules, updateMediaRules };
