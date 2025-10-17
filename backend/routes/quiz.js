const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const perplexityService = require('../services/perplexity');
const csvStorage = require('../services/csvStorage');

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
        const parsedValue = parseAnswer(factCheck.answer);
        
        questionsWithAnswers.push({
          id: uuidv4(),
          question: questionData.question,
          category: questionData.category,
          actualValue: parsedValue,
          sources: factCheck.sources,
          confidence: factCheck.confidence,
          expectedDataType: questionData.expectedDataType || 'number',
          sliderConfig: questionData.sliderConfig || {
            min: 0,
            max: 100,
            step: 1,
            unit: '',
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

// Helper function to parse answers into numbers
const parseAnswer = (answer) => {
  // Try to extract numbers from the answer text
  const numberMatch = answer.match(/\d+(?:\.\d+)?/);
  if (numberMatch) {
    return parseFloat(numberMatch[0]);
  }
  
  // If no number found, try to convert common text to numbers
  const lowerAnswer = answer.toLowerCase();
  if (lowerAnswer.includes('million')) {
    const millionMatch = lowerAnswer.match(/(\d+(?:\.\d+)?)/);
    if (millionMatch) return parseFloat(millionMatch[1]) * 1000000;
  }
  if (lowerAnswer.includes('billion')) {
    const billionMatch = lowerAnswer.match(/(\d+(?:\.\d+)?)/);
    if (billionMatch) return parseFloat(billionMatch[1]) * 1000000000;
  }
  
  // Default to 1 if we can't parse anything
  return 1;
};

module.exports = router;
