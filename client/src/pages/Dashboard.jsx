import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, TrendingUp, Play, FileText, Award, Clock } from 'lucide-react'

const Dashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalInterviews: 0,
    averageScore: 0,
    lastInterview: null,
    completedRounds: 0
  })

  useEffect(() => {
    // Load user statistics
    loadUserStats()
  }, [])

  const loadUserStats = () => {
    // Mock stats for now - in real app, fetch from API
    setStats({
      totalInterviews: 5,
      averageScore: 7.2,
      lastInterview: '2024-12-20',
      completedRounds: 15
    })
  }

  const handleTakeInterview = () => {
    navigate('/interview-setup')
  }

  const handleViewHistory = () => {
    navigate('/interview-history')
  }

  const handleViewPerformance = () => {
    navigate('/performance')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Interview Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back! Ready for your next interview?</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Current Streak</p>
                <p className="text-2xl font-bold text-blue-600">3 days</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Interviews</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalInterviews}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageScore}/10</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed Rounds</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedRounds}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Last Interview</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.lastInterview ? new Date(stats.lastInterview).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Take Interview */}
          <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                <Play className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Take Interview</h3>
              <p className="text-gray-600 mb-4">
                Start a new AI-powered mock interview with company-specific questions tailored to your experience and skills.
              </p>
              <button
                onClick={handleTakeInterview}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Start New Interview
              </button>
            </div>
          </div>

          {/* Quick Test */}
          <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mb-4">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Test</h3>
              <p className="text-gray-600 mb-4">
                Take a quick 2-question test to try out the enhanced feedback system (~5 minutes).
              </p>
              <button
                onClick={() => navigate('/interview-setup', { state: { quickTest: true } })}
                className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 transition-colors font-medium"
              >
                Quick Test
              </button>
            </div>
          </div>

          {/* View History */}
          <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Interview History</h3>
              <p className="text-gray-600 mb-4">
                Review your past interviews, questions asked, and detailed feedback to track your progress.
              </p>
              <button
                onClick={handleViewHistory}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors font-medium"
              >
                View History
              </button>
            </div>
          </div>

          {/* Performance Analytics */}
          <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Analytics</h3>
              <p className="text-gray-600 mb-4">
                Analyze your performance trends, strengths, weaknesses, and get personalized improvement suggestions.
              </p>
              <button
                onClick={handleViewPerformance}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors font-medium"
              >
                View Analytics
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className="text-gray-600">Completed Google Software Engineer interview - Score: 8.5/10</p>
                <span className="text-sm text-gray-400">2 days ago</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-gray-600">Uploaded new resume with React and Node.js skills</p>
                <span className="text-sm text-gray-400">3 days ago</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <p className="text-gray-600">Completed Microsoft Backend Engineer interview - Score: 7.2/10</p>
                <span className="text-sm text-gray-400">5 days ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard