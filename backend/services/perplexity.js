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
    const prompt = `For the discussion about '${topic}', generate 5 statistics that test core, relevant, quantifiable knowledge in this area. Frame each as a question. Focus on factual, measurable data that someone could reasonably know or guess. 

Return as JSON array with this structure:
[
  {
    "question": "What is the question text?",
    "category": "brief category description",
    "actualValue": 42.5,
    "unit": "%",
    "displayFormat": "percentage",
    "sliderConfig": {
      "min": 0,
      "max": 100,
      "step": 1,
      "labels": {
        "min": "0%",
        "max": "100%"
      }
    }
  }
]

IMPORTANT FORMATTING RULES:
- actualValue: The real numerical answer (without units, just the number)
- unit: The unit symbol ("%", "$", "people", "years", "°C", "°F", "M", "B", etc.)
- displayFormat: Choose from "percentage", "currency", "population", "year", "count", "temperature", "large_number"
- Set realistic slider ranges based on the actual value (actual value should be within the range)
- Make displayLabels user-friendly (e.g., "1.5M" instead of "1500000")

FORMATTING EXAMPLES:
- Percentage: actualValue: 78, unit: "%", displayFormat: "percentage", slider: 0-100
- Currency: actualValue: 648.1, unit: "B", displayFormat: "currency", slider: 0-1000B  
- Population: actualValue: 8200000000, unit: "people", displayFormat: "population", slider: 7B-9B
- Year: actualValue: 2024, unit: "years", displayFormat: "year", slider: 2020-2030
- Count: actualValue: 948, unit: "", displayFormat: "count", slider: 0-1000
- Temperature: actualValue: 25, unit: "°C", displayFormat: "temperature", slider: -40-50°C`;

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
          actualValue: 50,
          unit: "%",
          displayFormat: "percentage",
          sliderConfig: { min: 0, max: 100, step: 1, labels: { min: "0%", max: "100%" } }
        },
        { 
          question: "How many...?", 
          category: "quantities",
          actualValue: 500,
          unit: "",
          displayFormat: "count",
          sliderConfig: { min: 0, max: 1000, step: 1, labels: { min: "0", max: "1000" } }
        },
        { 
          question: "What is the current...?", 
          category: "current data",
          actualValue: 50,
          unit: "",
          displayFormat: "count",
          sliderConfig: { min: 0, max: 100, step: 1, labels: { min: "0", max: "100" } }
        },
        { 
          question: "How much does... cost?", 
          category: "economics",
          actualValue: 500,
          unit: "$",
          displayFormat: "currency",
          sliderConfig: { min: 0, max: 1000, step: 1, labels: { min: "$0", max: "$1000" } }
        },
        { 
          question: "What year did... happen?", 
          category: "timeline",
          actualValue: 2020,
          unit: "years",
          displayFormat: "year",
          sliderConfig: { min: 1900, max: 2030, step: 1, labels: { min: "1900", max: "2030" } }
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
