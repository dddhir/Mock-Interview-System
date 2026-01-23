import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, Award, Eye, ArrowLeft } from 'lucide-react'

const InterviewHistory = () => {
  const navigate = useNavigate()
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInterviewHistory()
  }, [])

  const loadInterviewHistory = async () => {
    try {
      // Mock data for now - in real app, fetch from API
      const mockInterviews = [
        {
          id: '1',
          company: 'Google',
          role: 'Software Engineer',
          date: '2024-12-20',
          duration: '45 minutes',
          score: 8.5,
          status: 'completed',
          questionsAnswered: 8,
          rounds: ['Technical', 'Project', 'HR']
        },
        {
          id: '2',
          company: 'Microsoft',
          role: 'Backend Engineer',
          date: '2024-12-18',
          duration: '38 minutes',
          score: 7.2,
          status: 'completed',
          questionsAnswered: 6,
          rounds: ['Technical', 'Project']
        },
        {
          id: '3',
          company: 'Netflix',
          role: 'Full Stack Engineer',
          date: '2024-12-15',
          duration: '52 minutes',
          score: 9.1,
          status: 'completed',
          questionsAnswered: 10,
          rounds: ['Technical', 'Project', 'HR']
        }
      ]
      
      setInterviews(mockInterviews)
    } catch (error) {
      console.error('Error loading interview history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600 bg-green-100'
    if (score >= 6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const viewInterview = (interviewId) => {
    navigate(`/interview-review/${interviewId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Interview History</h1>
              <p className="text-gray-600 mt-1">Review your past interviews and track your progress</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">{interviews.length}</div>
            <div className="text-sm text-gray-500">Total Interviews</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">
              {interviews.length > 0 ? (interviews.reduce((sum, i) => sum + i.score, 0) / interviews.length).toFixed(1) : '0'}
            </div>
            <div className="text-sm text-gray-500">Average Score</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">
              {interviews.reduce((sum, i) => sum + i.questionsAnswered, 0)}
            </div>
            <div className="text-sm text-gray-500">Questions Answered</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">
              {interviews.filter(i => i.score >= 8).length}
            </div>
            <div className="text-sm text-gray-500">High Scores (8+)</div>
          </div>
        </div>

        {/* Interview List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Interviews</h2>
          </div>
          
          {interviews.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews yet</h3>
              <p className="text-gray-500 mb-4">Start your first interview to see your history here</p>
              <button
                onClick={() => navigate('/interview-setup')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Take Interview
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {interviews.map((interview) => (
                <div key={interview.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {interview.company} - {interview.role}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(interview.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {interview.duration}
                            </div>
                            <div className="flex items-center">
                              <Award className="h-4 w-4 mr-1" />
                              {interview.questionsAnswered} questions
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center space-x-4">
                        <div className="flex space-x-1">
                          {interview.rounds.map((round, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {round}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(interview.score)}`}>
                        {interview.score}/10
                      </div>
                      <button
                        onClick={() => viewInterview(interview.id)}
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default InterviewHistory