const express = require('express');
const router = express.Router();
const perplexityService = require('../services/perplexity');

// GET /api/topics/trending - Get trending topics
router.get('/trending', async (req, res) => {
  try {
    const trendingTopics = await perplexityService.discoverTrendingTopics();
    res.json({
      topics: trendingTopics,
      message: 'Trending topics retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching trending topics:', error);
    res.status(500).json({ error: 'Failed to fetch trending topics' });
  }
});

// POST /api/topics/discover - Discover topics (alternative endpoint)
router.post('/discover', async (req, res) => {
  try {
    const trendingTopics = await perplexityService.discoverTrendingTopics();
    
    // Filter for quantifiable topics only
    const quantifiableTopics = trendingTopics.filter(topic => topic.quantifiable);
    
    res.json({
      topics: quantifiableTopics,
      count: quantifiableTopics.length,
      message: 'Quantifiable topics discovered successfully'
    });
  } catch (error) {
    console.error('Error discovering topics:', error);
    res.status(500).json({ error: 'Failed to discover topics' });
  }
});

module.exports = router;
