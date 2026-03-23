import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Upload, User, Save, FileText } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import ProgressChart from '../components/ProgressChart'

const Profile = () => {
  const { user, updateProfile } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    experience: ''
  })
  const [loading, setLoading] = useState(false)
  const [resumeFile, setResumeFile] = useState(null)
  const [uploadingResume, setUploadingResume] = useState(false)
  const [interviewHistory, setInterviewHistory] = useState([])

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        experience: user.experience || ''
      })
    }
    fetchInterviewHistory()
  }, [user])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const fetchInterviewHistory = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/auth/interview-history', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setInterviewHistory(response.data.history || [])
    } catch (error) {
      console.error('Error fetching interview history:', error)
    }
  }



  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await updateProfile(formData)
      if (result.success) {
        toast.success('Profile updated successfully!')
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const testResumeQuestions = async () => {
    try {
      const response = await axios.post('/api/interview/generate-resume-questions', {
        role: 'Software Engineer',
        company: 'Tech Company'
      })
      
      if (response.data.success) {
        const questions = response.data.questions
        const questionList = questions.map((q, i) => `${i + 1}. ${q.question}`).join('\n\n')
        
        toast.success('Resume questions generated!')
        alert(`Generated Questions:\n\n${questionList}`)
      }
    } catch (error) {
      console.error('Error testing resume questions:', error)
      toast.error(error.response?.data?.message || 'Failed to generate questions')
    }
  }

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF, DOCX, or TXT file')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB')
      return
    }

    setResumeFile(file)
    setUploadingResume(true)

    const formData = new FormData()
    formData.append('resume', file)

    try {
      const response = await axios.post('/api/rag/upload-resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        toast.success(`Resume uploaded! Found ${response.data.skillsCount} skills: ${response.data.extractedSkills.join(', ')}`)
      }
    } catch (error) {
      console.error('Resume upload error:', error)
      toast.error(error.response?.data?.message || 'Failed to upload resume')
    } finally {
      setUploadingResume(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
        <p className="text-gray-600">
          Update your profile information to get personalized interview questions
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Personal Information</span>
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="Tell us about yourself, your background, and career goals..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level
                </label>
                <select
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select experience level</option>
                  <option value="entry">Entry Level (0-2 years)</option>
                  <option value="mid">Mid Level (2-5 years)</option>
                  <option value="senior">Senior Level (5+ years)</option>
                  <option value="lead">Lead/Principal (8+ years)</option>
                </select>
              </div>



              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Resume Upload */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Resume</span>
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Resume
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleResumeUpload}
                    className="hidden"
                    id="resume-upload"
                    disabled={uploadingResume}
                  />
                  <label
                    htmlFor="resume-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {uploadingResume ? 'Uploading...' : 'Click to upload resume'}
                    </span>
                    <span className="text-xs text-gray-500">
                      PDF, DOCX, or TXT (max 10MB)
                    </span>
                  </label>
                </div>
              </div>

              {user?.resume && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-800">
                      Resume uploaded: {user.resume.filename}
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Uploaded on {new Date(user.resume.uploadDate).toLocaleDateString()}
                  </p>
                  {user.skills && user.skills.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-green-700 font-medium">Auto-extracted skills:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {user.skills.slice(0, 8).map((skill, index) => (
                          <span key={index} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            {skill}
                          </span>
                        ))}
                        {user.skills.length > 8 && (
                          <span className="text-xs text-green-600">+{user.skills.length - 8} more</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="text-xs text-gray-500">
                <p className="mb-2">💡 <strong>Why upload a resume?</strong></p>
                <ul className="space-y-1 ml-4">
                  <li>• Get personalized project-based questions</li>
                  <li>• Questions tailored to your experience</li>
                  <li>• Better interview preparation</li>
                </ul>
              </div>

              {user?.resume && (
                <button
                  onClick={testResumeQuestions}
                  className="w-full mt-3 text-sm bg-green-600 text-white py-2 px-3 rounded-md hover:bg-green-700 transition-colors"
                >
                  🧪 Test Resume Questions
                </button>
              )}
            </div>
          </div>

          {/* Profile Summary */}
          <div className="bg-primary-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-primary-900 mb-4">Profile Completion</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-primary-800">Basic Info</span>
                <span className="text-sm font-medium text-primary-900">
                  {formData.name && user?.email ? '✓' : '○'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-primary-800">Skills (Auto-extracted)</span>
                <span className="text-sm font-medium text-primary-900">
                  {user?.resume ? '✓' : '○'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-primary-800">Experience</span>
                <span className="text-sm font-medium text-primary-900">
                  {formData.experience ? '✓' : '○'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-primary-800">Resume</span>
                <span className="text-sm font-medium text-primary-900">
                  {user?.resume ? '✓' : '○'}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-primary-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-primary-900">Completion</span>
                <span className="text-sm font-bold text-primary-900">
                  {Math.round(([
                    formData.name && user?.email,
                    user?.resume,
                    formData.experience,
                    user?.resume
                  ].filter(Boolean).length / 4) * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Interview Progress Chart */}
          <ProgressChart 
            data={interviewHistory} 
            title="Your Interview Progress" 
            height={350} 
          />

          {/* Tips */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Profile Tips</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Complete your profile for better question matching</li>
              <li>• Upload your resume to auto-extract skills and get personalized questions</li>
              <li>• Update your resume regularly to keep skills current</li>
              <li>• Be honest about your experience level</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile