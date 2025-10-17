'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { generateQuiz, getAllQuizzes, type QuizSummary } from '@/lib/api'

export default function Home() {
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([])
  const [quizzesLoading, setQuizzesLoading] = useState(true)

  useEffect(() => {
    loadQuizzes()
  }, [])

  const loadQuizzes = async () => {
    try {
      const quizzesData = await getAllQuizzes()
      setQuizzes(quizzesData)
    } catch (err) {
      console.error('Error loading quizzes:', err)
    } finally {
      setQuizzesLoading(false)
    }
  }

  const handleGenerateQuiz = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic')
      return
    }

    setLoading(true)
    setError('')

    try {
      const quiz = await generateQuiz(topic)
      // Redirect to quiz page
      window.location.href = `/quiz/${quiz.quizLinkId}`
    } catch (err) {
      setError('Failed to generate quiz. Please try again.')
      console.error('Error generating quiz:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-primary">Really?</CardTitle>
            <CardDescription className="text-lg">
              Test your knowledge on trending topics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="topic" className="text-sm font-medium">
                Enter a topic to quiz yourself on:
              </label>
              <input
                id="topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., AI development, climate change, economics..."
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={loading}
              />
            </div>
            
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
                {error}
              </div>
            )}

            <Button 
              onClick={handleGenerateQuiz} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Generating Quiz...' : 'Test Your Knowledge'}
            </Button>

            <div className="text-xs text-muted-foreground text-center">
              <p>You'll have 5 seconds to answer each question</p>
              <p>Get your Score</p>
            </div>
          </CardContent>
        </Card>

        {/* Existing Quizzes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Existing Quizzes</CardTitle>
            <CardDescription>
              Take a quiz on topics that have already been created
            </CardDescription>
          </CardHeader>
          <CardContent>
            {quizzesLoading ? (
              <div className="text-center py-8">
                <div className="text-lg">Loading quizzes...</div>
              </div>
            ) : quizzes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No quizzes available yet. Create one above!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quizzes.map((quiz) => (
                  <Card key={quiz.quizLinkId} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = `/quiz/${quiz.quizLinkId}`}>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2">{quiz.topicName}</h3>
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(quiz.createdAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
