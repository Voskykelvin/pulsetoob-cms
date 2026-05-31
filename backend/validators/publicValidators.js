const { body } = require('express-validator');

const contactTopics = ['collaboration', 'advertising', 'correction', 'story_tip', 'general'];

const newsletterRules = [
  body('email').isEmail().normalizeEmail().withMessage('Enter a valid email address'),
  body('source').optional().isString().trim().isLength({ max: 120 }).withMessage('source is too long'),
];

const contactRules = [
  body('name').isString().trim().isLength({ min: 2, max: 160 }).withMessage('Name must be 2 to 160 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Enter a valid email address'),
  body('topic').isIn(contactTopics).withMessage('Choose a valid topic'),
  body('subject').isString().trim().isLength({ min: 4, max: 180 }).withMessage('Subject must be 4 to 180 characters'),
  body('message').isString().trim().isLength({ min: 20, max: 5000 }).withMessage('Message must be 20 to 5000 characters'),
  body('consent')
    .custom((value) => value === true || value === 'true')
    .withMessage('Please confirm the contact disclaimer'),
];

module.exports = {
  contactRules,
  newsletterRules,
};
