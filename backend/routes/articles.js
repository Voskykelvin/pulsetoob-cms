const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  articleCreateRules,
  articleUpdateRules,
  articleListRules,
  scheduleRules,
  autoSaveRules,
  bulkActionRules,
  uuidParam,
} = require('../validators/articleValidators');

router.post('/', authenticate, articleCreateRules, validate, articleController.create.bind(articleController));
router.post('/bulk', authenticate, authorize('admin','editor','super_admin'), bulkActionRules, validate, articleController.bulkAction.bind(articleController));
router.get('/', optionalAuth, articleListRules, validate, articleController.getAll.bind(articleController));
router.get('/:id/related', uuidParam(), validate, articleController.getRelated.bind(articleController));
router.get('/:slugOrId', optionalAuth, articleController.getOne.bind(articleController));
router.put('/:id', authenticate, articleUpdateRules, validate, articleController.update.bind(articleController));
router.delete('/:id', authenticate, uuidParam(), validate, articleController.delete.bind(articleController));
router.post('/:id/publish', authenticate, uuidParam(), validate, articleController.publish.bind(articleController));
router.post('/:id/unpublish', authenticate, uuidParam(), validate, articleController.unpublish.bind(articleController));
router.post('/:id/schedule', authenticate, scheduleRules, validate, articleController.schedule.bind(articleController));
router.patch('/:id/autosave', authenticate, autoSaveRules, validate, articleController.autoSave.bind(articleController));
module.exports = router;
