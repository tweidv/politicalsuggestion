'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { getQuiz, submitResults, type Question, type Perception } from '@/lib/api'
import { v4 as uuidv4 } from 'uuid'

interface QuizState {
  currentQuestionIndex: number
  perceptions: Perception[]
  timeRemaining: number
  timerActive: boolean
  userGuess: number
  showingAnswer: boolean
}

export default function QuizPage() {
  const params = useParams()
  const quizLinkId = params.quizLinkId as string

  const [quiz, setQuiz] = useState<{ quizLinkId: string; topicName: string; questions: Question[] } | null>(null)
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestionIndex: 0,
    perceptions: [],
    timeRemaining: 5,
    timerActive: false,
    userGuess: 50,
    showingAnswer: false
  })
  const [sessionId] = useState(() => uuidv4())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadQuiz()
  }, [quizLinkId])

  useEffect(() => {
    let timer: NodeJS.Timeout

    if (quizState.timerActive && quizState.timeRemaining > 0) {
      timer = setTimeout(() => {
        setQuizState(prev => ({
          ...prev,
          timeRemaining: prev.timeRemaining - 0.1
        }))
      }, 100)
    } else if (quizState.timerActive && quizState.timeRemaining <= 0) {
      handleAnswerSubmit()
    }

    return () => clearTimeout(timer)
  }, [quizState.timerActive, quizState.timeRemaining])

  const loadQuiz = async () => {
    try {
      const quizData = await getQuiz(quizLinkId)
      setQuiz(quizData)
    } catch (err) {
      setError('Failed to load quiz')
      console.error('Error loading quiz:', err)
    } finally {
      setLoading(false)
    }
  }

  const startQuestion = () => {
    setQuizState(prev => ({
      ...prev,
      timerActive: true,
      timeRemaining: 5,
      showingAnswer: false,
      userGuess: 50
    }))
  }

  const handleAnswerSubmit = () => {
    if (!quiz) return

    const currentQuestion = quiz.questions[quizState.currentQuestionIndex]
    const timeToGuess = 5 - quizState.timeRemaining

    const perception: Perception = {
      questionId: currentQuestion.id,
      userGuessValue: quizState.userGuess,
      actualValue: currentQuestion.actualValue,
      timeToGuess,
      questionText: currentQuestion.question
    }

    setQuizState(prev => ({
      ...prev,
      perceptions: [...prev.perceptions, perception],
      timerActive: false,
      showingAnswer: true
    }))
  }

  const nextQuestion = () => {
    if (!quiz) return

    const nextIndex = quizState.currentQuestionIndex + 1
    
    if (nextIndex >= quiz.questions.length) {
      // Quiz complete, submit results
      submitQuizResults()
    } else {
      setQuizState(prev => ({
        ...prev,
        currentQuestionIndex: nextIndex,
        timeRemaining: 5,
        timerActive: false,
        showingAnswer: false,
        userGuess: 50
      }))
    }
  }

  const submitQuizResults = async () => {
    try {
      const result = await submitResults(sessionId, quizLinkId, quizState.perceptions)
      window.location.href = `/result/${result.resultId}`
    } catch (err) {
      setError('Failed to submit results')
      console.error('Error submitting results:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <div className="text-lg">Loading quiz...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <div className="text-lg text-destructive">{error || 'Quiz not found'}</div>
            <Button onClick={() => window.location.href = '/'} className="mt-4">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestion = quiz.questions[quizState.currentQuestionIndex]
  const progress = ((quizState.currentQuestionIndex + (quizState.showingAnswer ? 1 : 0)) / quiz.questions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{quiz.topicName}</CardTitle>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Question {quizState.currentQuestionIndex + 1} of {quiz.questions.length}
              </div>
              <div className="text-sm text-muted-foreground">
                PKI: Personal Knowledge Index
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </CardHeader>
        </Card>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {currentQuestion.question}
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {currentQuestion.category}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!quizState.timerActive && !quizState.showingAnswer && (
              <div className="text-center">
                <Button onClick={startQuestion} size="lg">
                  Start Question
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  You'll have 5 seconds to answer
                </p>
              </div>
            )}

            {quizState.timerActive && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${quizState.timeRemaining <= 1 ? 'text-destructive pulse-red' : 'text-primary'}`}>
                    {Math.ceil(quizState.timeRemaining)}
                  </div>
                  <div className="text-sm text-muted-foreground">seconds remaining</div>
                </div>

                <div className="space-y-4">
                  <div className="text-center">
                    <label className="text-lg font-medium">Your guess:</label>
                    <div className="text-2xl font-bold text-primary mt-2">
                      {quizState.userGuess}
                    </div>
                  </div>
                  
                  <Slider
                    value={[quizState.userGuess]}
                    onValueChange={(value) => setQuizState(prev => ({ ...prev, userGuess: value[0] }))}
                    max={100}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                  
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>0</span>
                    <span>100</span>
                  </div>
                </div>

                <div className="text-center">
                  <Button onClick={handleAnswerSubmit} variant="outline">
                    Lock In Answer
                  </Button>
                </div>
              </div>
            )}

            {quizState.showingAnswer && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-secondary rounded-lg">
                    <div className="text-sm text-muted-foreground">Your Guess</div>
                    <div className="text-2xl font-bold text-primary">
                      {quizState.perceptions[quizState.perceptions.length - 1]?.userGuessValue}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <div className="text-sm text-muted-foreground">Actual Value</div>
                    <div className="text-2xl font-bold text-primary">
                      {currentQuestion.actualValue}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Sources:</h4>
                  <div className="space-y-1">
                    {currentQuestion.sources.map((source, index) => (
                      <div key={index} className="text-sm">
                        <a 
                          href={source.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {source.name}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  <Button onClick={nextQuestion} size="lg">
                    {quizState.currentQuestionIndex + 1 >= quiz.questions.length ? 'See Results' : 'Next Question'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
