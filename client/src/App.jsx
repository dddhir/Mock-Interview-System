import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Interview from './pages/Interview'
import Results from './pages/Results'
import Profile from './pages/Profile'
import InterviewSetup from './pages/InterviewSetup'
import InterviewHistory from './pages/InterviewHistory'
import Performance from './pages/Performance'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/interview-setup" element={<InterviewSetup />} />
            <Route path="/interview-history" element={<InterviewHistory />} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/interview/:sessionId" element={<Interview />} />
            <Route path="/results/:sessionId" element={<Results />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  )
}

export default App