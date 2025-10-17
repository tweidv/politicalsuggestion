const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const csvStorage = require('../services/csvStorage');

// POST /api/results/submit - Submit quiz results
router.post('/submit', async (req, res) => {
  try {
    const { sessionId, quizLinkId, perceptions, entrySource } = req.body;
    
    if (!sessionId || !quizLinkId || !perceptions) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Calculate PKI score
    const pkiScore = csvStorage.calculatePKI(perceptions);
    
    // Create result data
    const resultId = uuidv4();
    const resultData = {
      resultId,
      sessionId,
      quizLinkId,
      pkiScore,
      perceptions: JSON.stringify(perceptions),
      createdAt: new Date().toISOString()
    };

    // Save result
    await csvStorage.saveResult(resultData);

    // Save session data
    const sessionData = {
      sessionId,
      quizLinkId,
      entrySource: entrySource || 'direct',
      timestamp: new Date().toISOString()
    };
    await csvStorage.saveSession(sessionData);

    res.json({
      resultId,
      pkiScore,
      message: 'Results submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting results:', error);
    res.status(500).json({ error: 'Failed to submit results' });
  }
});

// GET /api/results/:resultId - Get result by ID
router.get('/:resultId', async (req, res) => {
  try {
    const { resultId } = req.params;
    const result = await csvStorage.getResult(resultId);
    
    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    res.json({
      resultId: result['Result ID'],
      sessionId: result['Session ID'],
      quizLinkId: result['Quiz Link ID'],
      pkiScore: parseInt(result['PKI Score']),
      perceptions: result.perceptions,
      createdAt: result['Created At']
    });
  } catch (error) {
    console.error('Error fetching result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
