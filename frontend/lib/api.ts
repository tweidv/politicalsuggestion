const API_BASE_URL = 'http://localhost:3001/api'

export interface SliderConfig {
  min: number
  max: number
  step: number
  unit: string
  labels: {
    min: string
    max: string
  }
}

export interface Question {
  id: string
  question: string
  category: string
  actualValue: number
  sources: Array<{ name: string; url: string }>
  confidence: string
  expectedDataType: string
  sliderConfig: SliderConfig
}

export interface Quiz {
  quizLinkId: string
  topicName: string
  questions: Question[]
}

export interface Perception {
  questionId: string
  userGuessValue: number
  actualValue: number
  timeToGuess: number
  questionText: string
  expectedDataType?: string
  sliderConfig?: SliderConfig
}

export interface QuizResult {
  resultId: string
  pkiScore: number
}

export async function generateQuiz(topic: string): Promise<Quiz> {
  const response = await fetch(`${API_BASE_URL}/quiz/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ topic }),
  })

  if (!response.ok) {
    throw new Error('Failed to generate quiz')
  }

  return response.json()
}

export async function getQuiz(quizLinkId: string): Promise<Quiz> {
  const response = await fetch(`${API_BASE_URL}/quiz/${quizLinkId}`)

  if (!response.ok) {
    throw new Error('Quiz not found')
  }

  return response.json()
}

export async function submitResults(
  sessionId: string,
  quizLinkId: string,
  perceptions: Perception[],
  entrySource?: string
): Promise<QuizResult> {
  const response = await fetch(`${API_BASE_URL}/results/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId,
      quizLinkId,
      perceptions,
      entrySource,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to submit results')
  }

  return response.json()
}

export async function getResult(resultId: string) {
  const response = await fetch(`${API_BASE_URL}/results/${resultId}`)

  if (!response.ok) {
    throw new Error('Result not found')
  }

  return response.json()
}

export interface QuizSummary {
  quizLinkId: string
  topicName: string
  topicUrl: string
  createdAt: string
}

export async function getAllQuizzes(): Promise<QuizSummary[]> {
  const response = await fetch(`${API_BASE_URL}/quiz`)

  if (!response.ok) {
    throw new Error('Failed to fetch quizzes')
  }

  return response.json()
}