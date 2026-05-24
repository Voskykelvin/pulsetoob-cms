const { body, param, query } = require('express-validator');

const USER_ROLES = ['super_admin', 'admin', 'editor', 'author', 'contributor', 'subscriber'];

const userListRules = [
  query('page').optional().isInt({ min: 1 }).toInt().withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('limit must be between 1 and 100'),
  query('role').optional().isIn(USER_ROLES).withMessage(`role must be one of: ${USER_ROLES.join(', ')}`),
];

const createUserRules = [
  body('username').isString().trim().isLength({ min: 3, max: 50 }).withMessage('username must be 3 to 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('email must be valid'),
  body('password').isString().isLength({ min: 8, max: 128 }).withMessage('password must be 8 to 128 characters'),
  body('firstName').optional({ nullable: true }).isString().trim().isLength({ max: 100 }).withMessage('firstName must be 100 characters or fewer'),
  body('lastName').optional({ nullable: true }).isString().trim().isLength({ max: 100 }).withMessage('lastName must be 100 characters or fewer'),
  body('bio').optional({ nullable: true }).isString().trim().isLength({ max: 2000 }).withMessage('bio must be 2000 characters or fewer'),
  body('role').optional().isIn(USER_ROLES).withMessage(`role must be one of: ${USER_ROLES.join(', ')}`),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false').toBoolean(),
  body('isVerified').optional().isBoolean().withMessage('isVerified must be true or false').toBoolean(),
];

const updateUserRules = [
  param('id').isUUID().withMessage('id must be a valid UUID'),
  body('role').optional().isIn(USER_ROLES).withMessage(`role must be one of: ${USER_ROLES.join(', ')}`),
  body('permissions').optional().isObject().withMessage('permissions must be an object'),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false').toBoolean(),
  body('isVerified').optional().isBoolean().withMessage('isVerified must be true or false').toBoolean(),
];

const userIdParamRules = [
  param('id').isUUID().withMessage('id must be a valid UUID'),
];

module.exports = {
  USER_ROLES,
  createUserRules,
  updateUserRules,
  userListRules,
  userIdParamRules,
};
