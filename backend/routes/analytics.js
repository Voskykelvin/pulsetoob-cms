const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
router.post('/track', optionalAuth, analyticsController.trackEvent.bind(analyticsController));
router.get('/dashboard', authenticate, authorize('admin','editor','super_admin'), analyticsController.getDashboard.bind(analyticsController));
router.get('/article/:id', authenticate, analyticsController.getArticleAnalytics.bind(analyticsController));
module.exports = router;
