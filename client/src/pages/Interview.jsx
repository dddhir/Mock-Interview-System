import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Clock, Send, SkipForward } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const Interview = () => {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)

  useEffect(() => {
    fetchSession()
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [sessionId])

  const fetchSession = async () => {
    try {
      const response = await axios.get(`/api/interview/session/${sessionId}`)
      const sessionData = response.data.session
      setSession(sessionData)
      
      // If session is completed, redirect to results
      if (sessionData.status === 'completed') {
        navigate(`/results/${sessionId}`)
        return
      }
      
      // Set the current question from the session
      if (sessionData.currentQuestion) {
        setCurrentQuestion(sessionData.currentQuestion)
      } else if (sessionData.questionsAsked.length === 0) {
        toast.error('No question available. Please start a new interview.')
        navigate('/dashboard')
      }
      
    } catch (error) {
      console.error('Error fetching session:', error)
      if (error.response?.status === 404) {
        toast.error('Interview session not found. Please start a new interview.')
      } else {
        toast.error('Failed to load interview session')
      }
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const submitAnswer = async () => {
    if (!answer.trim()) {
      toast.error('Please provide an answer')
      return
    }

    setSubmitting(true)
    try {
      console.log('Submitting answer for question:', currentQuestion)
      
      const response = await axios.post('/api/interview/submit-answer', {
        sessionId,
        questionId: currentQuestion?.id || 'generated',
        answer: answer.trim()
      })

      if (response.data.success) {
        // Show feedback
        toast.success(`Score: ${response.data.evaluation.score}/10`)
        
        // Update session
        setSession(prev => ({
          ...prev,
          questionsAsked: [...prev.questionsAsked, {
            question: currentQuestion.text,
            answer: answer.trim(),
            score: response.data.evaluation.score,
            feedback: response.data.evaluation.feedback
          }],
          totalScore: response.data.totalScore
        }))

        // Clear answer
        setAnswer('')

        // Check if interview is complete
        if (response.data.sessionComplete) {
          toast.success('Interview completed!')
          navigate(`/results/${sessionId}`)
        } else if (response.data.nextQuestion) {
          setCurrentQuestion(response.data.nextQuestion)
        }
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
      toast.error(error.response?.data?.message || 'Failed to submit answer')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Session Not Found</h2>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {session.role} Interview - {session.company}
            </h1>
            <p className="text-gray-600">
              Round: <span className="capitalize font-medium">{session.currentRound}</span> • 
              Question {session.questionsAsked.length + 1}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock className="h-5 w-5" />
              <span className="font-mono text-lg">{formatTime(timeElapsed)}</span>
            </div>
            <div className="text-sm text-gray-500">
              Score: {session.totalScore}/{session.questionsAsked.length * 10}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{session.questionsAsked.length}/8 questions</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(session.questionsAsked.length / 8) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Current Question */}
      {currentQuestion && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded text-sm font-medium">
                {currentQuestion.topic}
              </span>
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                {currentQuestion.section}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {currentQuestion.text}
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Answer
              </label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Take your time to provide a detailed answer
              </div>
              <div className="space-x-3">
                <button
                  onClick={() => {
                    setAnswer('I would like to skip this question.')
                    submitAnswer()
                  }}
                  disabled={submitting}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 flex items-center space-x-2"
                >
                  <SkipForward className="h-4 w-4" />
                  <span>Skip</span>
                </button>
                <button
                  onClick={submitAnswer}
                  disabled={submitting || !answer.trim()}
                  className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>{submitting ? 'Submitting...' : 'Submit Answer'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Previous Questions */}
      {session.questionsAsked.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Previous Questions</h3>
          <div className="space-y-4">
            {session.questionsAsked.slice(-3).map((qa, index) => (
              <div key={index} className="border-l-4 border-primary-200 pl-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900">{qa.question}</h4>
                  <span className={`text-sm font-semibold ${
                    qa.score >= 8 ? 'text-green-600' : 
                    qa.score >= 6 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {qa.score}/10
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-2">{qa.answer}</p>
                {qa.feedback && (
                  <p className="text-gray-500 text-xs italic">{qa.feedback}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Interview