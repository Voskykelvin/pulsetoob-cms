const express = require('express');
const router = express.Router();
const adController = require('../controllers/adController');
const validate = require('../middleware/validate');
const { slotParamRules, adIdParamRules } = require('../validators/adValidators');

router.get('/:slot', slotParamRules, validate, adController.getActiveAd.bind(adController));
router.post('/:id/impression', adIdParamRules, validate, adController.trackImpression.bind(adController));
router.post('/:id/click', adIdParamRules, validate, adController.trackClick.bind(adController));

module.exports = router;
