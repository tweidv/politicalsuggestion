const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

class CSVStorage {
  constructor() {
    this.dataDir = path.join(__dirname, 'data');
    this.quizzesFile = path.join(this.dataDir, 'quizzes.csv');
    this.resultsFile = path.join(this.dataDir, 'results.csv');
    this.sessionsFile = path.join(this.dataDir, 'sessions.csv');
  }

  async ensureDataDirectory() {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
    }
  }

  async initializeFiles() {
    // Initialize quizzes.csv if it doesn't exist
    try {
      await fs.access(this.quizzesFile);
    } catch {
      const csvWriter = createCsvWriter({
        path: this.quizzesFile,
        header: [
          { id: 'quizLinkId', title: 'Quiz Link ID' },
          { id: 'topicName', title: 'Topic Name' },
          { id: 'topicUrl', title: 'Topic URL' },
          { id: 'questions', title: 'Questions JSON' },
          { id: 'createdAt', title: 'Created At' }
        ]
      });
      await csvWriter.writeRecords([]);
    }

    // Initialize results.csv if it doesn't exist
    try {
      await fs.access(this.resultsFile);
    } catch {
      const csvWriter = createCsvWriter({
        path: this.resultsFile,
        header: [
          { id: 'resultId', title: 'Result ID' },
          { id: 'sessionId', title: 'Session ID' },
          { id: 'quizLinkId', title: 'Quiz Link ID' },
          { id: 'pkiScore', title: 'PKI Score' },
          { id: 'perceptions', title: 'Perceptions JSON' },
          { id: 'createdAt', title: 'Created At' }
        ]
      });
      await csvWriter.writeRecords([]);
    }

    // Initialize sessions.csv if it doesn't exist
    try {
      await fs.access(this.sessionsFile);
    } catch {
      const csvWriter = createCsvWriter({
        path: this.sessionsFile,
        header: [
          { id: 'sessionId', title: 'Session ID' },
          { id: 'quizLinkId', title: 'Quiz Link ID' },
          { id: 'entrySource', title: 'Entry Source' },
          { id: 'timestamp', title: 'Timestamp' }
        ]
      });
      await csvWriter.writeRecords([]);
    }
  }

  async saveQuiz(quizData) {
    await this.initializeFiles();
    
    const csvWriter = createCsvWriter({
      path: this.quizzesFile,
      header: [
        { id: 'quizLinkId', title: 'Quiz Link ID' },
        { id: 'topicName', title: 'Topic Name' },
        { id: 'topicUrl', title: 'Topic URL' },
        { id: 'questions', title: 'Questions JSON' },
        { id: 'createdAt', title: 'Created At' }
      ],
      append: true
    });

    await csvWriter.writeRecords([quizData]);
  }

  async getQuiz(quizLinkId) {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(this.quizzesFile)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          const quiz = results.find(q => q['Quiz Link ID'] === quizLinkId);
          if (quiz) {
            try {
              quiz.questions = JSON.parse(quiz['Questions JSON']);
              resolve(quiz);
            } catch (error) {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        })
        .on('error', reject);
    });
  }

  async getAllQuizzes() {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(this.quizzesFile)
        .pipe(csv())
        .on('data', (data) => {
          try {
            data.questions = JSON.parse(data['Questions JSON']);
            results.push(data);
          } catch (error) {
            console.error('Error parsing quiz questions:', error);
          }
        })
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  async saveResult(resultData) {
    await this.initializeFiles();
    
    const csvWriter = createCsvWriter({
      path: this.resultsFile,
      header: [
        { id: 'resultId', title: 'Result ID' },
        { id: 'sessionId', title: 'Session ID' },
        { id: 'quizLinkId', title: 'Quiz Link ID' },
        { id: 'pkiScore', title: 'PKI Score' },
        { id: 'perceptions', title: 'Perceptions JSON' },
        { id: 'createdAt', title: 'Created At' }
      ],
      append: true
    });

    await csvWriter.writeRecords([resultData]);
  }

  async saveSession(sessionData) {
    await this.initializeFiles();
    
    const csvWriter = createCsvWriter({
      path: this.sessionsFile,
      header: [
        { id: 'sessionId', title: 'Session ID' },
        { id: 'quizLinkId', title: 'Quiz Link ID' },
        { id: 'entrySource', title: 'Entry Source' },
        { id: 'timestamp', title: 'Timestamp' }
      ],
      append: true
    });

    await csvWriter.writeRecords([sessionData]);
  }

  async getResult(resultId) {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(this.resultsFile)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          const result = results.find(r => r['Result ID'] === resultId);
          if (result) {
            try {
              result.perceptions = JSON.parse(result['Perceptions JSON']);
              resolve(result);
            } catch (error) {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        })
        .on('error', reject);
    });
  }

  calculatePKI(perceptions) {
    if (!perceptions || perceptions.length === 0) return 0;
    
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
}

module.exports = new CSVStorage();
