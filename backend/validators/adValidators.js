const { body, param, query } = require('express-validator');

const AD_SLOTS = ['header_leaderboard', 'sidebar_square', 'in_article_banner'];

const slotParamRules = [
  param('slot').isIn(AD_SLOTS).withMessage(`slot must be one of: ${AD_SLOTS.join(', ')}`),
];

const adIdParamRules = [
  param('id').isUUID().withMessage('id must be a valid UUID'),
];

const adListRules = [
  query('slot').optional().isIn(AD_SLOTS).withMessage(`slot must be one of: ${AD_SLOTS.join(', ')}`),
  query('isActive').optional().isIn(['true', 'false']).withMessage('isActive must be true or false'),
];

const createAdRules = [
  body('title').isString().trim().isLength({ min: 2, max: 160 }).withMessage('title must be 2 to 160 characters'),
  body('imageUrl').isString().trim().isLength({ min: 1, max: 1000 }).withMessage('imageUrl is required'),
  body('targetUrl').isURL({ require_protocol: true }).withMessage('targetUrl must be a valid URL'),
  body('slot').isIn(AD_SLOTS).withMessage(`slot must be one of: ${AD_SLOTS.join(', ')}`),
  body('sponsorName').optional({ nullable: true }).isString().trim().isLength({ max: 160 }).withMessage('sponsorName must be 160 characters or fewer'),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false').toBoolean(),
  body('startDate').optional({ nullable: true }).isISO8601().withMessage('startDate must be a valid date'),
  body('endDate').optional({ nullable: true }).isISO8601().withMessage('endDate must be a valid date'),
];

const updateAdRules = [
  ...adIdParamRules,
  body('title').optional().isString().trim().isLength({ min: 2, max: 160 }).withMessage('title must be 2 to 160 characters'),
  body('imageUrl').optional().isString().trim().isLength({ min: 1, max: 1000 }).withMessage('imageUrl is required'),
  body('targetUrl').optional().isURL({ require_protocol: true }).withMessage('targetUrl must be a valid URL'),
  body('slot').optional().isIn(AD_SLOTS).withMessage(`slot must be one of: ${AD_SLOTS.join(', ')}`),
  body('sponsorName').optional({ nullable: true }).isString().trim().isLength({ max: 160 }).withMessage('sponsorName must be 160 characters or fewer'),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false').toBoolean(),
  body('startDate').optional({ nullable: true }).isISO8601().withMessage('startDate must be a valid date'),
  body('endDate').optional({ nullable: true }).isISO8601().withMessage('endDate must be a valid date'),
];

module.exports = {
  AD_SLOTS,
  slotParamRules,
  adIdParamRules,
  adListRules,
  createAdRules,
  updateAdRules,
};
