# Deployment Guide

## Quick Deploy to Vercel

### Frontend Deployment
1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click "New Project" and import this repository
3. Set **Root Directory** to `frontend`
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = `https://your-backend-url.vercel.app/api`

### Backend Deployment
1. Create a new Vercel project for the backend
2. Set **Root Directory** to `backend`
3. Add environment variable:
   - `PERPLEXITY_API_KEY` = your actual Perplexity API key

### Environment Variables Needed

#### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://your-backend-url.vercel.app/api
```

#### Backend (.env)
```
PORT=3001
PERPLEXITY_API_KEY=your_actual_perplexity_api_key
NODE_ENV=production
```

## Local Development
```bash
# Install dependencies
npm run install-all

# Start both frontend and backend
npm run dev
```

## Project Structure
- `frontend/` - Next.js React application
- `backend/` - Express.js API server
- `backend/services/data/` - CSV data storage
