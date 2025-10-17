# MVP Specification: Really? - Dynamic Perception Index Engine

## Executive Summary
**Really?** is a real-time knowledge assessment platform that measures the gap between public perception and verifiable facts on trending social media topics. Users take quick 5-second quizzes on current debates, receive a Personal Knowledge Index (PKI) score, and can share their results to drive viral engagement. 

## Core Value Proposition
- **Real-time relevance**: Tests knowledge on topics actively being discussed
- **Unbiased measurement**: Focuses on quantifiable facts, not political opinions
- **Viral mechanics**: Shareable PKI scores create organic growth
- **Clean data**: 5-second response time captures intuitive beliefs (System 1 thinking)

## MVP Feature Set

### 1. Backend API (Core Functionality)

#### 1.1 Topic Discovery Service
```
Endpoint: POST /api/topics/discover
Purpose: Identify trending discussion topics
Data Sources: Perplexity Search API
Process: Search for "trending topics today" or specific areas of interest
Output: Topics with quantifiable elements
```

#### 1.2 Content Generation Pipeline
```
Step 1: POST /api/content/generate-questions
- Input: TopicName, TopicURL
- Process: Use Perplexity API to generate 5 factual questions
- Output: QuestionText array

Step 2: POST /api/content/fact-check
- Input: QuestionText
- Process: Use Perplexity Search API for verification
- Output: ActualValue, Sources (up to 5 authoritative sources)

Step 3: POST /api/content/store
- Process: Store complete quiz set in CSV file with unique QuizLinkID
- Output: QuizLinkID for sharing
```

### 2. Frontend Application (User Experience)

#### 2.1 Quiz Entry Flow
```
Route: /quiz/[QuizLinkID]
Components:
- Landing page with topic context
- "Test Your Knowledge" CTA button
- Question display with slider/input
- 5-second countdown timer
- "Lock In" button for early submission
```

#### 2.2 Question Interaction
```
Timeline:
- Question displays immediately
- User has 5 seconds to position slider/input for their guess
- 5-second countdown timer shows remaining time
- Auto-submit when timer expires
- Instant reveal of correct answer + sources
- Next question button
```

#### 2.3 Results & Sharing
```
Route: /result/[ResultID]
Components:
- Prominent PKI score display (0-100%)
- Breakdown of individual question performance
- Shareable link generation
- Social media preview optimization
```

### 3. Data Architecture

#### 3.1 Core Data Models
```javascript
// Quiz Session
{
  sessionId: string,
  quizLinkId: string,
  entrySource: string,
  timestamp: Date,
  perceptions: PerceptionData[]
}

// Individual Question Response
{
  questionId: string,
  userGuessValue: number,
  actualValue: number,
  timeToGuess: number,
  questionText: string
}

// Quiz Content
{
  quizLinkId: string,
  topicName: string,
  topicUrl: string,
  questions: QuestionData[],
  createdAt: Date
}
```

#### 3.2 PKI Scoring Algorithm
```javascript
function calculatePKI(perceptions) {
  let totalDeviation = 0;
  
  perceptions.forEach(perception => {
    const deviation = Math.abs(perception.userGuessValue - perception.actualValue);
    const relativeDeviation = deviation / perception.actualValue;
    totalDeviation += relativeDeviation;
  });
  
  const averageDeviation = totalDeviation / perceptions.length;
  const pkiScore = Math.max(0, 100 - (averageDeviation * 100));
  
  return Math.round(pkiScore);
}
```

### 4. Technical Implementation

#### 4.1 Technology Stack
- **Backend**: Node.js/Express (local development)
- **Data Storage**: CSV files for quiz data and results
- **Frontend**: Next.js with shadcn/ui components
- **APIs**: Perplexity Search API only
- **Development**: Local backend server with API endpoints

#### 4.2 API Integration Requirements
```
Perplexity Search API:
- Search for trending topics and current events
- Fact-checking and verification for generated questions
- Rate limits: Respect API quotas
- Cost optimization: Batch requests where possible

Data Storage:
- CSV files for quiz content storage
- CSV files for user responses and results
- Simple file-based data management
```

### 5. MVP Success Metrics

#### 5.1 User Engagement
- Quiz completion rate > 70%
- Average session duration: 2-3 minutes
- Share rate: > 20% of completed quizzes
- Return user rate: > 15%

#### 5.2 Content Quality
- Topic freshness: < 24 hours from trending to quiz
- Question accuracy: 100% fact-checked with sources
- PKI score distribution: Meaningful variance across users

#### 5.3 Viral Mechanics
- Organic shares per quiz: > 5
- Click-through rate on shared links: > 15%
- Cross-platform sharing: Twitter, Reddit, LinkedIn

### 6. MVP Development Focus

#### Core Features for Initial Build
- Local backend API with Node.js/Express
- Perplexity API integration for content generation
- Next.js frontend with shadcn/ui components
- 5-second timer functionality with slider input
- PKI scoring and results display
- Basic sharing functionality

#### Local Development Setup
- Backend runs on localhost:3001 (API server)
- Frontend runs on localhost:3000 (Next.js dev server)
- CSV files for data storage (quiz content, user responses)
- Environment variables for Perplexity API key

### 7. Future Monetization Pathways

#### 7.1 Data Analytics Product
- Aggregate perception gap reports
- Echo chamber analysis by source platform
- Trending misinformation identification
- B2B sales to media organizations and research firms

#### 7.2 Premium Features
- Custom topic requests
- Detailed personal analytics
- Historical trend tracking
- Educational content recommendations

---

## Original Concept Context

This MVP is based on the Dynamic Perception Index Engine (PIE) concept, which measures and visualizes the public's gap between perceived beliefs and verifiable facts on live, trending topics. The platform generates highly shareable Personal Knowledge Index (PKI) scores that link directly to original social media discussions, creating a viral feedback loop that drives engagement while collecting valuable data on public perception gaps.

### Key Innovation Points:
1. **Dynamic Topic Sourcing**: Continuously identifies the most active discussions on social media
2. **Unbiased Statistic Generation**: Creates factual questions that test broad knowledge, not ideological points
3. **Clean Data Collection**: Uses 5-second response time limits to capture System 1 (intuitive) beliefs
4. **High Virality**: Generates shareable PKI scores that link back to original discussions
5. **Future Data Value**: Aggregate anonymized data becomes a valuable research product
