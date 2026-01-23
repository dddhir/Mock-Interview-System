import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Target, Award, BookOpen, ArrowLeft, BarChart3 } from 'lucide-react'

const Performance = () => {
  const navigate = useNavigate()
  const [performanceData, setPerformanceData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPerformanceData()
  }, [])

  const loadPerformanceData = async () => {
    try {
      // Mock performance data - in real app, fetch from API
      const mockData = {
        overallScore: 7.8,
        trend: 'improving',
        totalInterviews: 5,
        skillBreakdown: {
          'JavaScript': { score: 8.5, interviews: 4, trend: 'stable' },
          'React': { score: 8.2, interviews: 3, trend: 'improving' },
          'Node.js': { score: 7.8, interviews: 3, trend: 'improving' },
          'System Design': { score: 6.5, interviews: 2, trend: 'declining' },
          'Databases': { score: 7.2, interviews: 3, trend: 'stable' },
          'APIs': { score: 8.0, interviews: 4, trend: 'improving' }
        },
        companyPerformance: {
          'Google': { score: 8.5, interviews: 2 },
          'Microsoft': { score: 7.2, interviews: 1 },
          'Netflix': { score: 9.1, interviews: 1 },
          'Amazon': { score: 6.8, interviews: 1 }
        },
        weakAreas: [
          'System Design',
          'Database Optimization',
          'Scalability Concepts'
        ],
        strongAreas: [
          'JavaScript Fundamentals',
          'React Development',
          'API Design'
        ],
        recommendations: [
          'Focus on system design patterns and scalability',
          'Practice database optimization techniques',
          'Review distributed systems concepts',
          'Work on explaining complex technical concepts clearly'
        ]
      }
      
      setPerformanceData(mockData)
    } catch (error) {
      console.error('Error loading performance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'declining':
        return <TrendingUp className="h-4 w-4 text-red-500 transform rotate-180" />
      default:
        return <BarChart3 className="h-4 w-4 text-gray-500" />
    }
  }

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!performanceData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Performance Data</h2>
          <p className="text-gray-600 mb-4">Complete some interviews to see your performance analytics</p>
          <button
            onClick={() => navigate('/interview-setup')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Take Interview
          </button>
        </div>
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
              <h1 className="text-3xl font-bold text-gray-900">Performance Analytics</h1>
              <p className="text-gray-600 mt-1">Track your progress and identify areas for improvement</p>
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
        {/* Overall Performance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Overall Score</p>
                <p className={`text-3xl font-bold ${getScoreColor(performanceData.overallScore)}`}>
                  {performanceData.overallScore}/10
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Award className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Interviews</p>
                <p className="text-3xl font-bold text-gray-900">{performanceData.totalInterviews}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Target className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Trend</p>
                <p className="text-3xl font-bold text-gray-900 capitalize">{performanceData.trend}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                {getTrendIcon(performanceData.trend)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Skill Breakdown */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Skill Performance</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {Object.entries(performanceData.skillBreakdown).map(([skill, data]) => (
                  <div key={skill} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{skill}</span>
                        <div className="flex items-center space-x-2">
                          {getTrendIcon(data.trend)}
                          <span className={`text-sm font-medium ${getScoreColor(data.score)}`}>
                            {data.score}/10
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            data.score >= 8 ? 'bg-green-500' : 
                            data.score >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${(data.score / 10) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{data.interviews} interviews</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Company Performance */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Company Performance</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {Object.entries(performanceData.companyPerformance).map(([company, data]) => (
                  <div key={company} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{company}</p>
                      <p className="text-sm text-gray-500">{data.interviews} interview(s)</p>
                    </div>
                    <div className={`text-lg font-bold ${getScoreColor(data.score)}`}>
                      {data.score}/10
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Strengths and Weaknesses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Strong Areas */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Award className="h-5 w-5 text-green-600 mr-2" />
                Strong Areas
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {performanceData.strongAreas.map((area, index) => (
                  <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-gray-900">{area}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Weak Areas */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Target className="h-5 w-5 text-red-600 mr-2" />
                Areas for Improvement
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {performanceData.weakAreas.map((area, index) => (
                  <div key={index} className="flex items-center p-3 bg-red-50 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                    <span className="text-gray-900">{area}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-lg shadow mt-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <BookOpen className="h-5 w-5 text-blue-600 mr-2" />
              Personalized Recommendations
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {performanceData.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start p-4 bg-blue-50 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <p className="text-gray-900">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Performance