'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getResult, getQuiz, type Perception } from '@/lib/api'

interface ResultData {
  resultId: string
  pkiScore: number
  perceptions: Perception[]
  quizLinkId: string
}

export default function ResultPage() {
  const params = useParams()
  const resultId = params.resultId as string

  const [result, setResult] = useState<ResultData | null>(null)
  const [quiz, setQuiz] = useState<{ topicName: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadResult()
  }, [resultId])

  const loadResult = async () => {
    try {
      const resultData = await getResult(resultId)
      setResult(resultData)
      
      // Load quiz data for topic name
      const quizData = await getQuiz(resultData.quizLinkId)
      setQuiz(quizData)
    } catch (err) {
      setError('Failed to load results')
      console.error('Error loading result:', err)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreMessage = (score: number) => {
    if (score >= 90) return "Exceptional! You're incredibly well-informed!"
    if (score >= 80) return "Great job! You have strong knowledge in this area."
    if (score >= 70) return "Good work! You're above average."
    if (score >= 60) return "Not bad! There's room for improvement."
    if (score >= 50) return "Keep learning! You're getting there."
    return "Don't worry! Everyone starts somewhere. Keep exploring!"
  }

  const shareResult = async () => {
    const quizUrl = `${window.location.origin}/quiz/${result?.quizLinkId}`
    
    try {
      await navigator.clipboard.writeText(quizUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <div className="text-lg">Loading results...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <div className="text-lg text-destructive">{error || 'Results not found'}</div>
            <Button onClick={() => window.location.href = '/'} className="mt-4">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Results Header */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Your Results</CardTitle>
            <div className="text-lg text-muted-foreground">
              Topic: {quiz?.topicName}
            </div>
          </CardHeader>
        </Card>

        {/* Score */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-4">
              <CardTitle className="text-2xl">Score</CardTitle>
              <Button onClick={shareResult} size="sm" variant="outline">
                {copied ? 'Copied!' : 'Share'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className={`text-6xl font-bold ${getScoreColor(result.pkiScore)}`}>
              {result.pkiScore}%
            </div>
            <div className="text-lg">
              {getScoreMessage(result.pkiScore)}
            </div>
            <div className="w-full bg-secondary rounded-full h-4">
              <div 
                className={`h-4 rounded-full transition-all duration-1000 ${
                  result.pkiScore >= 80 ? 'bg-green-500' : 
                  result.pkiScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${result.pkiScore}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Question Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Question Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.perceptions.map((perception, index) => {
              const accuracy = Math.max(0, 100 - (Math.abs(perception.userGuessValue - perception.actualValue) / perception.actualValue * 100))
              
              return (
                <div key={perception.questionId} className="border rounded-lg p-4 space-y-2">
                  <div className="font-medium">
                    Question {index + 1}: {perception.questionText}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Your Guess</div>
                      <div className="font-bold">{perception.userGuessValue}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Actual Value</div>
                      <div className="font-bold">{perception.actualValue}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Accuracy</div>
                      <div className={`font-bold ${accuracy >= 80 ? 'text-green-600' : accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {Math.round(accuracy)}%
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>


        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button onClick={() => window.location.href = '/'} variant="outline">
            Take Another Quiz
          </Button>
          <Button onClick={() => window.location.href = '/'}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  )
}
