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
        "category": "brief category description"
      }
    ]`;

    const response = await this.search(prompt);
    
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No valid JSON found in response');
    } catch (error) {
      console.error('Error parsing questions:', error);
      // Fallback: return basic questions
      return [
        { question: "What percentage of...?", category: "statistics" },
        { question: "How many...?", category: "quantities" },
        { question: "What is the current...?", category: "current data" },
        { question: "How much does... cost?", category: "economics" },
        { question: "What year did... happen?", category: "timeline" }
      ];
    }
  }

  async factCheck(question) {
    const prompt = `Find the most accurate, current answer to this question: "${question}". Provide the specific numerical value or fact, along with 3-5 authoritative sources. Return as JSON:
    {
      "answer": "the specific answer",
      "sources": [
        {"name": "Source Name", "url": "source_url"},
        {"name": "Source Name", "url": "source_url"}
      ],
      "confidence": "high/medium/low"
    }`;

    const response = await this.search(prompt);
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No valid JSON found in response');
    } catch (error) {
      console.error('Error parsing fact check:', error);
      return {
        answer: "Data not available",
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
