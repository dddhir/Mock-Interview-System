import { useState } from 'react'
import axios from 'axios'

const AuthDebug = () => {
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(false)

  const testEndpoint = async (name, url, method = 'GET', data = null, headers = {}) => {
    try {
      setLoading(true)
      const config = { method, url, headers }
      if (data) config.data = data
      
      const response = await axios(config)
      setResults(prev => ({
        ...prev,
        [name]: { success: true, data: response.data, status: response.status }
      }))
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [name]: { 
          success: false, 
          error: error.response?.data?.message || error.message,
          status: error.response?.status || 'Network Error'
        }
      }))
    } finally {
      setLoading(false)
    }
  }

  const runTests = async () => {
    setResults({})
    
    // Test 1: Health check
    await testEndpoint('health', '/api/health')
    
    // Test 2: Registration
    await testEndpoint('register', '/api/auth/register', 'POST', {
      email: 'test@example.com',
      password: 'testpassword123',
      name: 'Test User'
    })
    
    // Test 3: Login
    await testEndpoint('login', '/api/auth/login', 'POST', {
      email: 'test@example.com',
      password: 'testpassword123'
    })
    
    // Test 4: Profile (with token if login succeeded)
    const token = localStorage.getItem('token')
    if (token) {
      await testEndpoint('profile', '/api/auth/profile', 'GET', null, {
        'Authorization': `Bearer ${token}`
      })
    }
  }

  const clearStorage = () => {
    localStorage.clear()
    delete axios.defaults.headers.common['Authorization']
    setResults({})
    alert('Browser storage cleared!')
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">🔧 Auth System Debug</h2>
      
      <div className="flex space-x-4 mb-6">
        <button
          onClick={runTests}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Run Auth Tests'}
        </button>
        
        <button
          onClick={clearStorage}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Clear Storage
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-semibold mb-2">Current Token:</h3>
          <p className="text-sm font-mono break-all">
            {localStorage.getItem('token') || 'No token found'}
          </p>
        </div>

        {Object.entries(results).map(([name, result]) => (
          <div key={name} className={`p-4 rounded border-l-4 ${
            result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
          }`}>
            <h3 className="font-semibold capitalize mb-2">
              {result.success ? '✅' : '❌'} {name} Test
              <span className="ml-2 text-sm text-gray-600">({result.status})</span>
            </h3>
            
            {result.success ? (
              <pre className="text-sm bg-white p-2 rounded overflow-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            ) : (
              <p className="text-red-700 font-medium">{result.error}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold text-yellow-800 mb-2">💡 Troubleshooting Tips:</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Make sure the backend server is running on port 5001</li>
          <li>• Clear browser storage if you see token-related errors</li>
          <li>• Check browser console for network errors</li>
          <li>• Verify MongoDB connection in server logs</li>
        </ul>
      </div>
    </div>
  )
}

export default AuthDebug