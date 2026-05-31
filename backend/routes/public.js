const express = require('express');
const publicController = require('../controllers/publicController');
const validate = require('../middleware/validate');
const { contactRules, newsletterRules } = require('../validators/publicValidators');

const router = express.Router();

router.post('/newsletter/subscribe', newsletterRules, validate, publicController.subscribe.bind(publicController));
router.post('/contact', contactRules, validate, publicController.contact.bind(publicController));

module.exports = router;
