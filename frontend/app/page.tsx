'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { generateQuiz } from '@/lib/api'

export default function Home() {
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
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
            <p>Get your Personal Knowledge Index (PKI) score</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
