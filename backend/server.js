const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const quizRoutes = require('./routes/quiz');
const topicsRoutes = require('./routes/topics');
const resultsRoutes = require('./routes/results');

// Routes
app.use('/api/quiz', quizRoutes);
app.use('/api/topics', topicsRoutes);
app.use('/api/results', resultsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Really? Backend is running' });
});

// Serve static files for CSV data
app.use('/data', express.static(path.join(__dirname, 'data')));

app.listen(PORT, () => {
  console.log(`🚀 Really? Backend running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
