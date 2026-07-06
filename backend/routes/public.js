const express = require('express');
const publicController = require('../controllers/publicController');
const validate = require('../middleware/validate');
const { authorParamRules, contactRules, newsletterRules } = require('../validators/publicValidators');

const router = express.Router();

router.get('/authors/:id', authorParamRules, validate, publicController.getAuthor.bind(publicController));
router.post('/newsletter/subscribe', newsletterRules, validate, publicController.subscribe.bind(publicController));
router.post('/contact', contactRules, validate, publicController.contact.bind(publicController));

module.exports = router;
