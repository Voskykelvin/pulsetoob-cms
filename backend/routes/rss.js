const express = require('express');
const router = express.Router();
const rssService = require('../services/rssService');
router.get('/feed', async (req, res) => {
  try { const xml = await rssService.generateMainFeed(); res.set('Content-Type', 'application/xml'); res.send(xml); }
  catch (error) { res.status(500).json({ error: 'Failed to generate RSS feed' }); }
});
router.get('/category/:slug', async (req, res) => {
  try { const xml = await rssService.generateCategoryFeed(req.params.slug); res.set('Content-Type', 'application/xml'); res.send(xml); }
  catch (error) { res.status(500).json({ error: 'Failed to generate category RSS feed' }); }
});
router.get('/msn', async (req, res) => {
  try { const xml = await rssService.generateMSNFeed(); res.set('Content-Type', 'application/xml'); res.send(xml); }
  catch (error) { res.status(500).json({ error: 'Failed to generate MSN feed' }); }
});
module.exports = router;
