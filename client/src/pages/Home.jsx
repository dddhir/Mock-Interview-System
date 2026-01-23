import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Brain, Target, Zap, Users } from 'lucide-react'

const Home = () => {
  const { user } = useAuth()

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-20">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Master Your Tech Interviews with{' '}
          <span className="text-primary-600">AI-Powered Practice</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Get personalized interview practice with our advanced RAG-powered AI system. 
          Practice technical, project, and HR questions tailored to your experience and target role.
        </p>
        <div className="space-x-4">
          <Link
            to="/interview-setup"
            className="bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            🚀 Start Interview
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white rounded-lg shadow-sm">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Why Choose Our AI Interview System?
          </h2>
          <p className="text-lg text-gray-600">
            Advanced features powered by cutting-edge AI technology
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center p-6">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">RAG-Powered Questions</h3>
            <p className="text-gray-600">
              Intelligent question selection based on your profile and previous answers using Retrieval-Augmented Generation
            </p>
          </div>

          <div className="text-center p-6">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Personalized Practice</h3>
            <p className="text-gray-600">
              Questions tailored to your experience level, target company, and role requirements
            </p>
          </div>

          <div className="text-center p-6">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-time Feedback</h3>
            <p className="text-gray-600">
              Instant AI-powered evaluation with detailed feedback and improvement suggestions
            </p>
          </div>

          <div className="text-center p-6">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Multi-Round Practice</h3>
            <p className="text-gray-600">
              Complete interview simulation with technical, project, and HR rounds
            </p>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600">
            Simple steps to start your interview practice
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-primary-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              1
            </div>
            <h3 className="text-xl font-semibold mb-2">Set Your Profile</h3>
            <p className="text-gray-600">
              Enter your experience level, target role, and tech stack. Upload your resume for personalized questions.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-primary-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              2
            </div>
            <h3 className="text-xl font-semibold mb-2">Start Interview</h3>
            <p className="text-gray-600">
              Begin with technical questions, move to project discussions, and finish with HR questions.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-primary-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              3
            </div>
            <h3 className="text-xl font-semibold mb-2">Get Feedback</h3>
            <p className="text-gray-600">
              Receive detailed feedback, scores, and personalized recommendations for improvement.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      {!user && (
        <div className="bg-primary-600 text-white py-16 rounded-lg text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Ace Your Next Interview?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of developers who have improved their interview skills with our AI system
          </p>
          <Link
            to="/register"
            className="bg-white text-primary-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Start Free Practice
          </Link>
        </div>
      )}
    </div>
  )
}

export default Home