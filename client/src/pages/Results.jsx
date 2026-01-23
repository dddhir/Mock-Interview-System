import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Trophy, Clock, Target, TrendingUp, Home, RotateCcw } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const Results = () => {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchResults()
  }, [sessionId])

  const fetchResults = async () => {
    try {
      const response = await axios.get(`/api/interview/session/${sessionId}`)
      setSession(response.data.session)
    } catch (error) {
      console.error('Error fetching results:', error)
      toast.error('Failed to load interview results')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    if (!session || !session.questionsAsked.length) return null

    const totalQuestions = session.questionsAsked.length
    const totalScore = session.totalScore
    const averageScore = totalScore / totalQuestions
    const percentage = (averageScore / 10) * 100

    const topicBreakdown = {}
    session.questionsAsked.forEach(qa => {
      if (!topicBreakdown[qa.topic]) {
        topicBreakdown[qa.topic] = { total: 0, count: 0 }
      }
      topicBreakdown[qa.topic].total += qa.score
      topicBreakdown[qa.topic].count += 1
    })

    Object.keys(topicBreakdown).forEach(topic => {
      topicBreakdown[topic].average = topicBreakdown[topic].total / topicBreakdown[topic].count
    })

    return {
      totalQuestions,
      totalScore,
      averageScore,
      percentage,
      topicBreakdown,
      grade: percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : percentage >= 50 ? 'D' : 'F'
    }
  }

  const getGradeColor = (grade) => {
    const colors = {
      'A': 'text-green-600 bg-green-100',
      'B': 'text-blue-600 bg-blue-100', 
      'C': 'text-yellow-600 bg-yellow-100',
      'D': 'text-orange-600 bg-orange-100',
      'F': 'text-red-600 bg-red-100'
    }
    return colors[grade] || 'text-gray-600 bg-gray-100'
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
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Results Not Found</h2>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  const stats = calculateStats()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Trophy className="h-16 w-16 text-yellow-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Complete!</h1>
          <p className="text-gray-600">
            {session.role} Interview at {session.company}
          </p>
        </div>
      </div>

      {/* Overall Score */}
      {stats && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-4xl font-bold mb-4 ${getGradeColor(stats.grade)}`}>
              {stats.grade}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {stats.totalScore}/{stats.totalQuestions * 10} Points
            </h2>
            <p className="text-gray-600">
              Average Score: {stats.averageScore.toFixed(1)}/10 ({stats.percentage.toFixed(1)}%)
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
                <p className="text-2xl font-bold text-blue-600">{stats.totalQuestions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Accuracy</h3>
                <p className="text-2xl font-bold text-green-600">{stats.percentage.toFixed(0)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Round</h3>
                <p className="text-2xl font-bold text-purple-600 capitalize">{session.currentRound}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Topic Breakdown */}
      {stats && Object.keys(stats.topicBreakdown).length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Topic</h3>
          <div className="space-y-4">
            {Object.entries(stats.topicBreakdown).map(([topic, data]) => (
              <div key={topic} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{topic}</span>
                    <span className="text-sm text-gray-500">
                      {data.average.toFixed(1)}/10 ({data.count} questions)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${(data.average / 10) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Question Review */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Review</h3>
        <div className="space-y-6">
          {session.questionsAsked.map((qa, index) => (
            <div key={index} className="border-l-4 border-primary-200 pl-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900">Q{index + 1}: {qa.question}</h4>
                <span className={`text-sm font-semibold px-2 py-1 rounded ${
                  qa.score >= 8 ? 'text-green-700 bg-green-100' : 
                  qa.score >= 6 ? 'text-yellow-700 bg-yellow-100' : 
                  'text-red-700 bg-red-100'
                }`}>
                  {qa.score}/10
                </span>
              </div>
              <div className="mb-2">
                <p className="text-sm text-gray-600 mb-1"><strong>Your Answer:</strong></p>
                <p className="text-gray-700 text-sm bg-gray-50 p-2 rounded">{qa.answer}</p>
              </div>
              {qa.feedback && (
                <div>
                  <p className="text-sm text-gray-600 mb-1"><strong>Feedback:</strong></p>
                  <p className="text-gray-600 text-sm italic">{qa.feedback}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => navigate('/test-interview')}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
          >
            <RotateCcw className="h-5 w-5" />
            <span>Take Another Interview</span>
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
          >
            <Home className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Results