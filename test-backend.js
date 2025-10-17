// Simple test script to verify backend setup
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

console.log('Testing backend setup...');
console.log('Perplexity API Key:', process.env.PERPLEXITY_API_KEY ? 'Present' : 'Missing');
console.log('Port:', process.env.PORT || 3001);

// Test if we can require the services
try {
  const perplexityService = require('./backend/services/perplexity');
  console.log('✅ Perplexity service loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Perplexity service:', error.message);
}

try {
  const csvStorage = require('./backend/services/csvStorage');
  console.log('✅ CSV storage service loaded successfully');
} catch (error) {
  console.error('❌ Failed to load CSV storage service:', error.message);
}

console.log('Backend test complete');
