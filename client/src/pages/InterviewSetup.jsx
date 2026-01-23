import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, User, Briefcase, Building2, ArrowRight, X, Search, Plus } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const InterviewSetup = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [companiesLoading, setCompaniesLoading] = useState(true)
  const [companies, setCompanies] = useState([])
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeProcessing, setResumeProcessing] = useState(false)
  const [skillSearch, setSkillSearch] = useState('')
  const [skillSuggestions, setSkillSuggestions] = useState([])
  const [searchingSkills, setSearchingSkills] = useState(false)
  const [formData, setFormData] = useState({
    company: '',
    targetRole: '',
    experience: 'mid',
    skills: [],
    resumeContent: '',
    projects: [],
    workExperience: [],
    questionCount: 10
  })

  const experienceLevels = [
    { value: 'fresher', label: 'Fresher (0-1 years)', description: 'New to the industry' },
    { value: 'junior', label: 'Junior (1-3 years)', description: 'Some professional experience' },
    { value: 'mid', label: 'Mid-Level (3-6 years)', description: 'Solid professional experience' },
    { value: 'senior', label: 'Senior (6+ years)', description: 'Extensive experience and leadership' },
    { value: 'staff', label: 'Staff/Principal (8+ years)', description: 'Technical leadership and architecture' }
  ]

  const questionCountOptions = [
    { value: 5, label: '5 Questions', description: 'Quick practice (~10 mins)' },
    { value: 10, label: '10 Questions', description: 'Standard interview (~20 mins)' },
    { value: 15, label: '15 Questions', description: 'Comprehensive (~30 mins)' },
    { value: 20, label: '20 Questions', description: 'Full interview (~45 mins)' }
  ]

  const commonRoles = [
    'Software Engineer',
    'Backend Engineer', 
    'Frontend Engineer',
    'Full Stack Engineer',
    'Data Engineer',
    'DevOps Engineer',
    'Mobile Developer',
    'Product Manager',
    'Data Scientist',
    'Machine Learning Engineer'
  ]

  useEffect(() => {
    fetchCompanies()
  }, [])

  // Debounced skill search
  useEffect(() => {
    if (skillSearch.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchSkills(skillSearch)
      }, 300)
      return () => clearTimeout(timeoutId)
    } else {
      setSkillSuggestions([])
    }
  }, [skillSearch])

  const fetchCompanies = async () => {
    try {
      const response = await axios.get('/api/interview/companies')
      if (response.data.success) {
        setCompanies(response.data.companies)
        if (response.data.companies.length > 0) {
          setFormData(prev => ({
            ...prev,
            company: response.data.companies[0].value
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
      toast.error('Failed to load companies')
    } finally {
      setCompaniesLoading(false)
    }
  }

  const searchSkills = async (query) => {
    if (!query || query.length < 2) return
    
    setSearchingSkills(true)
    try {
      const response = await axios.get(`/api/interview/skills/search?q=${encodeURIComponent(query)}&limit=8`)
      if (response.data.success) {
        setSkillSuggestions(response.data.skills)
      }
    } catch (error) {
      console.error('Error searching skills:', error)
    } finally {
      setSearchingSkills(false)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF, DOC, DOCX, or TXT file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setResumeFile(file)
    setResumeProcessing(true)

    try {
      const formData = new FormData()
      formData.append('resume', file)

      const response = await axios.post('/api/interview/process-resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        const { projects, experience, skills, content } = response.data
        setFormData(prev => ({
          ...prev,
          projects: projects || [],
          workExperience: experience || [],
          resumeContent: content || '',
          skills: skills?.length > 0 ? [...new Set([...prev.skills, ...skills.slice(0, 10)])] : prev.skills
        }))
        toast.success(`Resume processed! Found ${projects?.length || 0} projects, ${experience?.length || 0} work experiences`)
      }
    } catch (error) {
      console.error('Error processing resume:', error)
      toast.error('Failed to process resume. Please try again.')
    } finally {
      setResumeProcessing(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSkillAdd = (skill) => {
    if (skill && !formData.skills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }))
      setSkillSearch('')
      setSkillSuggestions([])
    }
  }

  const handleSkillRemove = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }))
  }

  const handleSkillSearchKeyPress = (e) => {
    if (e.key === 'Enter' && skillSuggestions.length > 0) {
      e.preventDefault()
      handleSkillAdd(skillSuggestions[0])
    }
  }

  const startInterview = async (e) => {
    e.preventDefault()
    
    if (!formData.company || !formData.targetRole) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.skills.length === 0) {
      toast.error('Please add at least one skill')
      return
    }

    setLoading(true)

    try {
      const interviewData = {
        company: formData.company,
        role: formData.targetRole,
        experience: formData.experience,
        skills: formData.skills,
        resumeContent: formData.resumeContent,
        projects: formData.projects,
        workExperience: formData.workExperience,
        questionCount: formData.questionCount
      }

      console.log('Starting interview with:', interviewData)
      const response = await axios.post('/api/interview/start', interviewData)

      if (response.data.success) {
        toast.success('Interview started!')
        navigate(`/interview/${response.data.sessionId}`)
      }
    } catch (error) {
      console.error('Start interview error:', error)
      toast.error(error.response?.data?.message || 'Failed to start interview')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Interview Setup</h1>
              <p className="text-gray-600 mt-1">Configure your personalized interview experience</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={startInterview} className="space-y-8">
          {/* Resume Upload Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <FileText className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Resume Upload</h2>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                id="resume-upload"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                disabled={resumeProcessing}
              />
              <label htmlFor="resume-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {resumeFile ? resumeFile.name : 'Upload your resume'}
                </p>
                <p className="text-gray-500">
                  {resumeProcessing ? 'Processing resume...' : 'PDF, DOC, DOCX, or TXT (max 5MB)'}
                </p>
              </label>
            </div>

            {/* Extracted Skills */}
            {formData.projects.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Extracted Projects</h3>
                <div className="space-y-3">
                  {formData.projects.map((project, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900">{project.name}</h4>
                      {project.description && (
                        <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                      )}
                      {project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {project.technologies.map((tech, techIndex) => (
                            <span
                              key={techIndex}
                              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Skills Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Search className="h-6 w-6 text-purple-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Skills</h2>
            </div>
            
            <div className="space-y-4">
              {/* Skill Search */}
              <div className="relative">
                <input
                  type="text"
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  onKeyPress={handleSkillSearchKeyPress}
                  placeholder="Type to search skills (e.g., 'py' for Python, 'react' for React)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
                />
                {searchingSkills && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                  </div>
                )}
                
                {/* Skill Suggestions */}
                {skillSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {skillSuggestions.map((skill, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSkillAdd(skill)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center justify-between"
                      >
                        <span>{skill}</span>
                        <Plus className="h-4 w-4 text-gray-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Selected Skills */}
              {formData.skills.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Skills ({formData.skills.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleSkillRemove(skill)}
                          className="ml-2 text-purple-600 hover:text-purple-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {formData.skills.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p>Start typing to search and add your skills</p>
                  <p className="text-sm mt-1">e.g., "py" → Python, "react" → React, "node" → Node.js</p>
                </div>
              )}
            </div>
          </div>

          {/* Company Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Building2 className="h-6 w-6 text-green-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Target Company</h2>
            </div>
            
            {companiesLoading ? (
              <div className="animate-pulse bg-gray-200 h-12 rounded-md"></div>
            ) : (
              <select
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                required
              >
                <option value="">Select a company</option>
                {companies.map(company => (
                  <option key={company.value} value={company.value}>
                    {company.label} ({company.questionCount} questions)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Role and Experience */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Target Role */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <Briefcase className="h-6 w-6 text-purple-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Target Role</h2>
              </div>
              
              <input
                type="text"
                name="targetRole"
                value={formData.targetRole}
                onChange={handleInputChange}
                placeholder="e.g., Software Engineer"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
                list="common-roles"
                required
              />
              
              <datalist id="common-roles">
                {commonRoles.map(role => (
                  <option key={role} value={role} />
                ))}
              </datalist>
            </div>

            {/* Experience Level */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <User className="h-6 w-6 text-orange-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Experience</h2>
              </div>
              
              <select
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg"
                required
              >
                {experienceLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Question Count */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <FileText className="h-6 w-6 text-indigo-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Questions</h2>
              </div>
              
              <select
                name="questionCount"
                value={formData.questionCount}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
              >
                {questionCountOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              
              <p className="text-sm text-gray-500 mt-2">
                {questionCountOptions.find(o => o.value === formData.questionCount)?.description}
              </p>
            </div>
          </div>

          {/* Interview Preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Interview Preview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-800">Company:</span>
                <span className="ml-2 text-blue-700">
                  {companies.find(c => c.value === formData.company)?.label || 'Not selected'}
                </span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Role:</span>
                <span className="ml-2 text-blue-700">{formData.targetRole || 'Not specified'}</span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Experience:</span>
                <span className="ml-2 text-blue-700">
                  {experienceLevels.find(l => l.value === formData.experience)?.label}
                </span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Skills:</span>
                <span className="ml-2 text-blue-700">{formData.skills.length} skills selected</span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Projects:</span>
                <span className="ml-2 text-blue-700">{formData.projects.length} projects found</span>
              </div>
            </div>
          </div>

          {/* Start Interview Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || resumeProcessing || !formData.company || !formData.targetRole}
              className="flex items-center px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Starting Interview...
                </>
              ) : (
                <>
                  Start Interview
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default InterviewSetup