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
  if (!answer || typeof answer !== 'string') {
    return 1;
  }

  const lowerAnswer = answer.toLowerCase();
  
  // Remove common prefixes that might contain years or irrelevant numbers
  const cleanedAnswer = lowerAnswer
    .replace(/^(according to|based on|as of|in \d{4}|since \d{4}|from \d{4}|during \d{4})/i, '')
    .replace(/\b(19|20)\d{2}\b/g, '') // Remove years
    .replace(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b/g, '') // Remove dates
    .trim();

  // Look for percentage patterns first (most common)
  const percentageMatch = cleanedAnswer.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percentageMatch) {
    return parseFloat(percentageMatch[1]);
  }

  // Look for "is" or "are" patterns that indicate the main answer
  const isPattern = cleanedAnswer.match(/(?:is|are|was|were|stands at|reaches|amounts to|equals?)\s*(\d+(?:\.\d+)?)/);
  if (isPattern) {
    const value = parseFloat(isPattern[1]);
    // Check if it's followed by million/billion/trillion
    const afterValue = cleanedAnswer.substring(isPattern.index + isPattern[0].length);
    if (afterValue.includes('million')) {
      return value * 1000000;
    }
    if (afterValue.includes('billion')) {
      return value * 1000000000;
    }
    if (afterValue.includes('trillion')) {
      return value * 1000000000000;
    }
    if (afterValue.includes('thousand') || afterValue.includes('k')) {
      return value * 1000;
    }
    return value;
  }

  // Look for "approximately", "about", "around" patterns
  const approxPattern = cleanedAnswer.match(/(?:approximately|about|around|roughly|nearly|close to)\s*(\d+(?:\.\d+)?)/);
  if (approxPattern) {
    const value = parseFloat(approxPattern[1]);
    const afterValue = cleanedAnswer.substring(approxPattern.index + approxPattern[0].length);
    if (afterValue.includes('million')) {
      return value * 1000000;
    }
    if (afterValue.includes('billion')) {
      return value * 1000000000;
    }
    if (afterValue.includes('trillion')) {
      return value * 1000000000000;
    }
    if (afterValue.includes('thousand') || afterValue.includes('k')) {
      return value * 1000;
    }
    return value;
  }

  // Look for range patterns and take the middle
  const rangePattern = cleanedAnswer.match(/(\d+(?:\.\d+)?)\s*(?:to|-|–|and)\s*(\d+(?:\.\d+)?)/);
  if (rangePattern) {
    const min = parseFloat(rangePattern[1]);
    const max = parseFloat(rangePattern[2]);
    const middle = (min + max) / 2;
    
    const afterValue = cleanedAnswer.substring(rangePattern.index + rangePattern[0].length);
    if (afterValue.includes('million')) {
      return middle * 1000000;
    }
    if (afterValue.includes('billion')) {
      return middle * 1000000000;
    }
    if (afterValue.includes('trillion')) {
      return middle * 1000000000000;
    }
    if (afterValue.includes('thousand') || afterValue.includes('k')) {
      return middle * 1000;
    }
    return middle;
  }

  // Look for million/billion patterns
  if (cleanedAnswer.includes('million')) {
    const millionMatch = cleanedAnswer.match(/(\d+(?:\.\d+)?)\s*million/);
    if (millionMatch) {
      return parseFloat(millionMatch[1]) * 1000000;
    }
  }
  
  if (cleanedAnswer.includes('billion')) {
    const billionMatch = cleanedAnswer.match(/(\d+(?:\.\d+)?)\s*billion/);
    if (billionMatch) {
      return parseFloat(billionMatch[1]) * 1000000000;
    }
  }

  if (cleanedAnswer.includes('trillion')) {
    const trillionMatch = cleanedAnswer.match(/(\d+(?:\.\d+)?)\s*trillion/);
    if (trillionMatch) {
      return parseFloat(trillionMatch[1]) * 1000000000000;
    }
  }

  if (cleanedAnswer.includes('thousand') || cleanedAnswer.includes('k')) {
    const thousandMatch = cleanedAnswer.match(/(\d+(?:\.\d+)?)\s*(?:thousand|k)/);
    if (thousandMatch) {
      return parseFloat(thousandMatch[1]) * 1000;
    }
  }

  // Look for currency patterns
  const currencyMatch = cleanedAnswer.match(/\$(\d+(?:\.\d+)?)\s*(?:million|billion|trillion|thousand|k)?/);
  if (currencyMatch) {
    const value = parseFloat(currencyMatch[1]);
    const afterValue = cleanedAnswer.substring(currencyMatch.index + currencyMatch[0].length);
    if (afterValue.includes('million')) {
      return value * 1000000;
    }
    if (afterValue.includes('billion')) {
      return value * 1000000000;
    }
    if (afterValue.includes('trillion')) {
      return value * 1000000000000;
    }
    if (afterValue.includes('thousand') || afterValue.includes('k')) {
      return value * 1000;
    }
    return value;
  }

  // Look for any remaining number that's not a year
  const numberMatch = cleanedAnswer.match(/(\d+(?:\.\d+)?)/);
  if (numberMatch) {
    const value = parseFloat(numberMatch[1]);
    // Avoid years (1900-2100)
    if (value >= 1900 && value <= 2100) {
      // Skip this number and look for the next one
      const remaining = cleanedAnswer.substring(numberMatch.index + numberMatch[0].length);
      const nextNumberMatch = remaining.match(/(\d+(?:\.\d+)?)/);
      if (nextNumberMatch) {
        return parseFloat(nextNumberMatch[1]);
      }
    }
    return value;
  }
  
  // Default to 1 if we can't parse anything
  return 1;
};

module.exports = router;
