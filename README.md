# Really? - Dynamic Perception Index Engine MVP

A real-time knowledge assessment platform that measures the gap between public perception and verifiable facts on trending topics.

## Features

- **5-second response time**: Captures intuitive beliefs (System 1 thinking)
- **Real-time content generation**: Uses Perplexity API to create factual questions
- **PKI scoring**: Personal Knowledge Index measures accuracy
- **Viral sharing**: Shareable results with social media optimization
- **Local development**: CSV storage, no external dependencies

## Quick Start

### Prerequisites

- Node.js 18+ 
- Perplexity API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install-all
   ```

3. Set up environment variables:
   ```bash
   cp backend/env.example backend/.env
   ```
   Edit `backend/.env` and add your Perplexity API key:
   ```
   PERPLEXITY_API_KEY=your_api_key_here
   ```

### Running the Application

1. Start both backend and frontend:
   ```bash
   npm run dev
   ```

2. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

### Development Commands

- `npm run dev` - Start both backend and frontend
- `npm run backend` - Start only the backend server
- `npm run frontend` - Start only the frontend development server

## Architecture

### Backend (Node.js/Express)
- **API Routes**: Quiz generation, results submission, data retrieval
- **Perplexity Integration**: Content generation and fact-checking
- **CSV Storage**: Simple file-based data persistence
- **PKI Algorithm**: Calculates Personal Knowledge Index scores

### Frontend (Next.js + shadcn/ui)
- **Home Page**: Topic input and quiz generation
- **Quiz Interface**: 5-second timer with slider input
- **Results Page**: PKI score display and sharing functionality
- **Responsive Design**: Mobile-optimized interface

## API Endpoints

### Quiz Management
- `POST /api/quiz/generate` - Generate new quiz from topic
- `GET /api/quiz/:quizLinkId` - Retrieve quiz by ID

### Results
- `POST /api/results/submit` - Submit quiz results
- `GET /api/results/:resultId` - Get result by ID

### Topics
- `GET /api/topics/trending` - Get trending topics
- `POST /api/topics/discover` - Discover quantifiable topics

## Data Storage

The application uses CSV files for data persistence:

- `backend/data/quizzes.csv` - Quiz content and metadata
- `backend/data/results.csv` - User results and PKI scores
- `backend/data/sessions.csv` - Session tracking

## PKI Scoring Algorithm

The Personal Knowledge Index (PKI) is calculated as:

```
PKI = 100% - (Average Relative Deviation × 100%)
```

Where relative deviation = |UserGuess - ActualValue| / ActualValue

Higher PKI scores indicate more accurate knowledge.

## Environment Variables

```env
PORT=3001
PERPLEXITY_API_KEY=your_perplexity_api_key_here
NODE_ENV=development
```

## Project Structure

```
├── backend/
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic and external APIs
│   ├── data/           # CSV file storage
│   └── server.js       # Express server setup
├── frontend/
│   ├── app/            # Next.js app router pages
│   ├── components/     # Reusable UI components
│   ├── lib/           # Utility functions and API client
│   └── styles/        # Global CSS and Tailwind config
└── package.json       # Root package with dev scripts
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `npm run dev`
5. Submit a pull request

## License

MIT License - see LICENSE file for details
