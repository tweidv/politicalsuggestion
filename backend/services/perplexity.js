const axios = require('axios');

class PerplexityService {
  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY;
    this.baseURL = 'https://api.perplexity.ai/chat/completions';
  }

  async search(query, options = {}) {
    try {
      console.log('Perplexity API Key:', this.apiKey ? 'Present' : 'Missing');
      console.log('Query:', query);
      
      const response = await axios.post(
        this.baseURL,
        {
          model: 'sonar-pro',
          messages: [
            {
              role: 'user',
              content: query
            }
          ],
          stream: false,
          max_tokens: 1000,
          temperature: 0.2,
          ...options
        },
        {
          headers: {
            'authorization': `Bearer ${this.apiKey}`,
            'accept': 'application/json',
            'content-type': 'application/json'
          }
        }
      );

      console.log('Perplexity API Response received');
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Perplexity API Error:', error.response?.data || error.message);
      console.error('Full error:', error);
      throw new Error('Failed to fetch data from Perplexity');
    }
  }

  async generateQuestions(topic) {
    const prompt = `For the discussion about '${topic}', generate 5 statistics that test core, relevant, quantifiable knowledge in this area. Frame each as a question. Focus on factual, measurable data that someone could reasonably know or guess. Return as JSON array with this structure:
    [
      {
        "question": "What is the question text?",
        "category": "brief category description",
        "expectedDataType": "percentage|number|date|year|currency|temperature|population",
        "sliderConfig": {
          "min": 0,
          "max": 100,
          "step": 1,
          "unit": "%",
          "labels": {
            "min": "0%",
            "max": "100%"
          }
        }
      }
    ]

    For sliderConfig, choose appropriate ranges and units:
    - For percentages: min=0, max=100, unit="%"
    - For years: min=1900, max=2030, unit=""
    - For dates: min=1900, max=2030, unit="", labels as years
    - For large numbers (millions/billions): appropriate range, unit="M" or "B"
    - For currency: appropriate range, unit="$"
    - For temperatures: appropriate range, unit="°C" or "°F"
    - For populations: appropriate range, unit="people"`;

    console.log('Generating questions for topic:', topic);
    
    const response = await this.search(prompt);
    
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const jsonString = jsonMatch[0];
        const parsed = JSON.parse(jsonString);
        console.log('Successfully generated', parsed.length, 'questions');
        return parsed;
      }
      throw new Error('No valid JSON found in response');
    } catch (error) {
      console.error('Error parsing questions:', error);
      console.error('Response that failed to parse:', response);
      // Fallback: return basic questions with default slider configs
      return [
        { 
          question: "What percentage of...?", 
          category: "statistics",
          expectedDataType: "percentage",
          sliderConfig: { min: 0, max: 100, step: 1, unit: "%", labels: { min: "0%", max: "100%" } }
        },
        { 
          question: "How many...?", 
          category: "quantities",
          expectedDataType: "number",
          sliderConfig: { min: 0, max: 1000, step: 1, unit: "", labels: { min: "0", max: "1000" } }
        },
        { 
          question: "What is the current...?", 
          category: "current data",
          expectedDataType: "number",
          sliderConfig: { min: 0, max: 100, step: 1, unit: "", labels: { min: "0", max: "100" } }
        },
        { 
          question: "How much does... cost?", 
          category: "economics",
          expectedDataType: "currency",
          sliderConfig: { min: 0, max: 1000, step: 1, unit: "$", labels: { min: "$0", max: "$1000" } }
        },
        { 
          question: "What year did... happen?", 
          category: "timeline",
          expectedDataType: "year",
          sliderConfig: { min: 1900, max: 2030, step: 1, unit: "", labels: { min: "1900", max: "2030" } }
        }
      ];
    }
  }

  async factCheck(question) {
    const prompt = `Find the most accurate, current answer to this question: "${question}". 

IMPORTANT: Return ONLY a JSON object with this exact structure. Do not include any other text, explanations, or formatting outside the JSON:

{
  "numericalValue": 42.5,
  "unit": "%",
  "answerText": "The unemployment rate is 42.5%",
  "sources": [
    {"name": "Bureau of Labor Statistics", "url": "https://bls.gov"},
    {"name": "Federal Reserve Economic Data", "url": "https://fred.stlouisfed.org"}
  ],
  "confidence": "high"
}

Guidelines for the response:
- numericalValue: Extract the main numerical answer as a number (not a string)
- unit: The unit of measurement (%, $, people, years, etc.) or empty string if none
- answerText: A brief, clear statement of the answer
- sources: 2-3 authoritative sources with real URLs
- confidence: "high", "medium", or "low" based on data quality and recency

Focus on finding the most recent, authoritative data for this question.`;

    console.log('Fact-checking question:', question);
    
    const response = await this.search(prompt);
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonString = jsonMatch[0];
        const parsed = JSON.parse(jsonString);
        console.log('Fact-check completed with confidence:', parsed.confidence);
        return parsed;
      }
      throw new Error('No valid JSON found in response');
    } catch (error) {
      console.error('Error parsing fact check:', error);
      console.error('Response that failed to parse:', response);
      return {
        numericalValue: 1,
        unit: "",
        answerText: "Data not available",
        sources: [{ name: "Perplexity Search", url: "https://perplexity.ai" }],
        confidence: "low"
      };
    }
  }

  async discoverTrendingTopics() {
    const prompt = `What are the top 5 trending topics being discussed today that involve quantifiable, measurable facts or statistics? Focus on topics that people might have strong opinions about but may not know the actual data. Return as JSON array:
    [
      {
        "topic": "Brief topic description",
        "relevance": "Why this topic is trending",
        "quantifiable": true
      }
    ]`;

    const response = await this.search(prompt);
    
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No valid JSON found in response');
    } catch (error) {
      console.error('Error parsing trending topics:', error);
      return [
        { topic: "AI Development Speed", relevance: "Current AI advances", quantifiable: true },
        { topic: "Climate Change Statistics", relevance: "Environmental concerns", quantifiable: true },
        { topic: "Economic Indicators", relevance: "Market conditions", quantifiable: true },
        { topic: "Social Media Usage", relevance: "Digital trends", quantifiable: true },
        { topic: "Healthcare Costs", relevance: "Public health", quantifiable: true }
      ];
    }
  }
}

module.exports = new PerplexityService();
