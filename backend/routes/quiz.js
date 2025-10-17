const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const perplexityService = require('../services/perplexity');
const csvStorage = require('../services/csvStorage');

// GET /api/quiz - Get all quizzes
router.get('/', async (req, res) => {
  try {
    const quizzes = await csvStorage.getAllQuizzes();
    
    // Transform the data to match the expected format
    const transformedQuizzes = quizzes.map(quiz => ({
      quizLinkId: quiz['Quiz Link ID'],
      topicName: quiz['Topic Name'],
      topicUrl: quiz['Topic URL'],
      createdAt: quiz['Created At']
    }));

    res.json(transformedQuizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/quiz/:quizLinkId - Get quiz by ID
router.get('/:quizLinkId', async (req, res) => {
  try {
    const { quizLinkId } = req.params;
    const quiz = await csvStorage.getQuiz(quizLinkId);
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json({
      quizLinkId: quiz['Quiz Link ID'],
      topicName: quiz['Topic Name'],
      topicUrl: quiz['Topic URL'],
      questions: quiz.questions,
      createdAt: quiz['Created At']
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quiz/generate - Generate new quiz
router.post('/generate', async (req, res) => {
  try {
    const { topic } = req.body;
    
    console.log('Generating quiz for topic:', topic);
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    // Generate questions using Perplexity
    let questionsData;
    try {
      questionsData = await perplexityService.generateQuestions(topic);
    } catch (error) {
      console.error('ERROR in generateQuestions:', error);
      throw new Error(`Failed to generate questions: ${error.message}`);
    }
    
    // Fact-check each question
    console.log('Fact-checking', questionsData.length, 'questions...');
    const questionsWithAnswers = [];
    
    for (let i = 0; i < questionsData.length; i++) {
      const questionData = questionsData[i];
      
      try {
        const factCheck = await perplexityService.factCheck(questionData.question);
        
        questionsWithAnswers.push({
          id: uuidv4(),
          question: questionData.question,
          category: questionData.category,
          actualValue: factCheck.numericalValue || 1,
          unit: factCheck.unit || '',
          answerText: factCheck.answerText || 'Data not available',
          sources: factCheck.sources || [{ name: "Error", url: "N/A" }],
          confidence: factCheck.confidence || 'low',
          expectedDataType: questionData.expectedDataType || 'number',
          sliderConfig: questionData.sliderConfig || {
            min: 0,
            max: 100,
            step: 1,
            unit: factCheck.unit || '',
            labels: { min: '0', max: '100' }
          }
        });
      } catch (error) {
        console.error(`ERROR fact-checking question ${i + 1}:`, error);
        // Continue with other questions even if one fails
        questionsWithAnswers.push({
          id: uuidv4(),
          question: questionData.question,
          category: questionData.category,
          actualValue: 1, // Default value
          unit: '',
          answerText: 'Data not available',
          sources: [{ name: "Error", url: "N/A" }],
          confidence: "low",
          expectedDataType: questionData.expectedDataType || 'number',
          sliderConfig: questionData.sliderConfig || {
            min: 0,
            max: 100,
            step: 1,
            unit: '',
            labels: { min: '0', max: '100' }
          }
        });
      }
    }

    // Create quiz data
    const quizLinkId = uuidv4();
    const quizData = {
      quizLinkId,
      topicName: topic,
      topicUrl: '', // No URL for now since we're not using social media APIs
      questions: JSON.stringify(questionsWithAnswers),
      createdAt: new Date().toISOString()
    };

    // Save to CSV
    try {
      await csvStorage.saveQuiz(quizData);
      console.log('Quiz saved successfully with ID:', quizLinkId);
    } catch (error) {
      console.error('ERROR saving quiz to CSV:', error);
      throw new Error(`Failed to save quiz: ${error.message}`);
    }
    res.json({
      quizLinkId,
      topicName: topic,
      questions: questionsWithAnswers,
      message: 'Quiz generated successfully'
    });
  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ error: 'Failed to generate quiz', details: error.message });
  }
});


module.exports = router;
