'use client'

import { useState, useRef, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faPaperPlane, 
  faRobot, 
  faUser, 
  faLightbulb,
  faBug,
  faRocket,
  faBolt,
  faTrophy,
  faWrench,
  faClock,
  faMicrophone,
  faMicrophoneSlash,
  faStop,
  faCrown,
  faMedal,
  faAward,
  faBullhorn,
  faCalendar,
  faExclamationTriangle,
  faInfoCircle,
  faTimes,
  faHistory
} from '@fortawesome/free-solid-svg-icons'
import Image from 'next/image'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  id: string
  content: string
  role: 'user' | 'bot'
  timestamp: Date
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your hackathon AI assistant. I can help you with coding questions, project ideas, debugging, and more. What would you like to work on?',
      role: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPrompts, setShowPrompts] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const [userInfo, setUserInfo] = useState({
    ipAddress: '',
    sessionId: '',
    userAgent: '',
    displayName: '',
    location: ''
  })
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [showRegistration, setShowRegistration] = useState(false)
  const [hasProfile, setHasProfile] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)
  const [registrationForm, setRegistrationForm] = useState({
    userName: '',
    teamName: '',
    email: '',
    role: ''
  })
  const [loadHistory, setLoadHistory] = useState(true)
  const [showAdminCodeModal, setShowAdminCodeModal] = useState(false)
  const [adminCode, setAdminCode] = useState('')
  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Initialize speech recognition
  const initializeSpeechRecognition = () => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      
      if (SpeechRecognition) {
        setSpeechSupported(true)
        const recognition = new SpeechRecognition()
        
        // Configure recognition settings
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'
        
        // Handle results
        recognition.onresult = (event: any) => {
          let finalTranscript = ''
          let interimTranscript = ''
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }
          
          if (finalTranscript) {
            setInputMessage(prev => prev + finalTranscript + ' ')
          }
        }
        
        // Handle errors
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsRecording(false)
          
          if (event.error === 'not-allowed') {
            alert('Microphone access denied. Please enable microphone permissions in your browser.')
          } else if (event.error === 'no-speech') {
            console.log('No speech detected')
          } else {
            alert(`Speech recognition error: ${event.error}`)
          }
        }
        
        // Handle end
        recognition.onend = () => {
          setIsRecording(false)
        }
        
        recognition.onstart = () => {
          setIsRecording(true)
        }
        
        recognitionRef.current = recognition
      } else {
        setSpeechSupported(false)
        console.log('Speech recognition not supported in this browser')
      }
    }
  }

  // Start voice recording
  const startRecording = () => {
    if (recognitionRef.current && speechSupported) {
      try {
        recognitionRef.current.start()
      } catch (error) {
        console.error('Error starting speech recognition:', error)
        setIsRecording(false)
      }
    }
  }

  // Stop voice recording
  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop()
    }
  }

  // Toggle recording
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  // Function to automatically linkify URLs in text
  const linkifyText = (text: string) => {
    // Enhanced URL regex to catch more patterns
    const urlRegex = /(https?:\/\/[^\s<>\"{}|\\^`\[\]]+)/g
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
    const phoneRegex = /\b(\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g
    
    let processedText = text
    
    // First, handle emails
    processedText = processedText.replace(emailRegex, (email) => {
      // Check if already in markdown format
      const beforeEmail = processedText.substring(0, processedText.indexOf(email))
      if (beforeEmail.endsWith('](') || beforeEmail.endsWith('[') || beforeEmail.includes(`[${email}]`)) {
        return email
      }
      return `[${email}](mailto:${email})`
    })
    
    // Then handle phone numbers
    processedText = processedText.replace(phoneRegex, (phone) => {
      // Check if already in markdown format
      const beforePhone = processedText.substring(0, processedText.indexOf(phone))
      if (beforePhone.endsWith('](') || beforePhone.endsWith('[') || beforePhone.includes(`[${phone}]`)) {
        return phone
      }
      const cleanPhone = phone.replace(/[^\d+]/g, '')
      return `[${phone}](tel:${cleanPhone})`
    })
    
    // Finally, handle URLs
    processedText = processedText.replace(urlRegex, (url) => {
      // Remove trailing punctuation that might not be part of URL
      const cleanUrl = url.replace(/[.,;:!?]+$/, '')
      const trailingPunct = url.substring(cleanUrl.length)
      
      // Check if URL is already in markdown format
      const beforeUrl = processedText.substring(0, processedText.indexOf(url))
      if (beforeUrl.endsWith('](') || beforeUrl.endsWith('[') || beforeUrl.includes(`[${cleanUrl}]`)) {
        return url
      }
      
      // Create a user-friendly display text
      let displayText = 'Click here'
      try {
        const urlObj = new URL(cleanUrl)
        const domain = urlObj.hostname.replace('www.', '')
        
        // Use different display text based on domain
        if (domain.includes('github.com')) {
          displayText = 'View on GitHub'
        } else if (domain.includes('stackoverflow.com')) {
          displayText = 'View on Stack Overflow'
        } else if (domain.includes('docs.') || domain.includes('documentation')) {
          displayText = 'View documentation'
        } else if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
          displayText = 'Watch video'
        } else if (cleanUrl.length > 50) {
          displayText = `Visit ${domain}`
        } else {
          displayText = domain
        }
      } catch {
        // If URL parsing fails, use a generic display
        displayText = cleanUrl.length > 40 ? 'Click here' : cleanUrl
      }
      
      return `[${displayText}](${cleanUrl})${trailingPunct}`
    })
    
    return processedText
  }


  // Check if user has a profile
  const checkUserProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      const data = await response.json()
      
      if (data.hasProfile && data.profile) {
        setHasProfile(true)
        setProfileData(data.profile)
        setShowRegistration(false)
        console.log('👤 User profile found:', data.profile.user_name, '-', data.profile.team_name)
      } else {
        setHasProfile(false)
        setShowRegistration(true)
        console.log('👤 No user profile found, showing registration')
      }
    } catch (error) {
      console.error('Failed to check user profile:', error)
      setShowRegistration(true)
    }
  }

  // Create user profile
  const createUserProfile = async () => {
    if (!registrationForm.userName.trim() || !registrationForm.teamName.trim()) {
      alert('Please enter both your name and team name')
      return
    }

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          userName: registrationForm.userName.trim(),
          teamName: registrationForm.teamName.trim(),
          email: registrationForm.email.trim() || undefined,
          role: registrationForm.role.trim() || undefined
        }),
      })

      const data = await response.json()

      if (data.success) {
        setHasProfile(true)
        setProfileData(data.profile)
        setShowRegistration(false)
        console.log('👤 Profile created successfully:', data.profile.user_name)
        
        // Update userInfo with the profile data
        setUserInfo(prev => ({
          ...prev,
          displayName: `${data.profile.user_name} (${data.profile.team_name})`
        }))
      } else {
        alert('Failed to create profile: ' + data.error)
      }
    } catch (error) {
      console.error('Failed to create profile:', error)
      alert('Failed to create profile. Please try again.')
    }
  }

  // Load chat history from database (always IP-based)
  const loadChatHistory = async (shouldLoad: boolean = loadHistory) => {
    try {
      setIsLoadingHistory(true)
      
      if (!shouldLoad) {
        console.log('📜 Skipping chat history load (user preference)')
        setMessages([])
        setIsLoadingHistory(false)
        return
      }
      
      // Always load by IP address, not sessionId
      const response = await fetch('/api/chat/history')
      const data = await response.json()
      
      if (data.messages && data.messages.length > 0) {
        // Convert timestamp strings back to Date objects
        const loadedMessages = data.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
        
        // If we have previous messages, replace the initial bot message
        setMessages(loadedMessages)
        console.log(`📜 Loaded ${loadedMessages.length} previous messages`)
      } else {
        // Keep the default welcome message if no history
        console.log('📜 No previous chat history found')
      }
    } catch (error) {
      console.error('Failed to load chat history:', error)
      // Keep default messages on error
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // Handle history loading preference change
  const handleHistoryToggle = async (shouldLoad: boolean) => {
    setLoadHistory(shouldLoad)
    await loadChatHistory(shouldLoad)
  }

  // Handle admin access
  const handleAdminAccess = () => {
    setShowAdminCodeModal(true)
  }

  const verifyAdminCode = () => {
    if (adminCode === '7887') {
      setShowAdminCodeModal(false)
      setAdminCode('')
      // Navigate to admin page
      window.location.href = '/admin'
    } else {
      alert('Invalid admin code. Please try again.')
      setAdminCode('')
    }
  }

  const closeAdminModal = () => {
    setShowAdminCodeModal(false)
    setAdminCode('')
  }

  // Get IP and session info
  const getUserInfo = async () => {
    try {
      // Get or create session ID
      let sessionId = sessionStorage.getItem('hackathon-session')
      if (!sessionId) {
        sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
        sessionStorage.setItem('hackathon-session', sessionId)
      }

      // Fetch IP address from a free service
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      const ipAddress = data.ip
      
      // Get location info (optional)
      let location = ''
      try {
        const locationResponse = await fetch(`https://ipapi.co/${ipAddress}/json/`)
        const locationData = await locationResponse.json()
        location = `${locationData.city}, ${locationData.country_name}` || 'Unknown Location'
      } catch (error) {
        console.log('Could not fetch location:', error)
        location = 'Unknown Location'
      }
      
      const displayName = `User ${ipAddress.split('.').pop()}`
      
      return {
        ipAddress,
        sessionId,
        userAgent: navigator.userAgent,
        displayName,
        location
      }
    } catch (error) {
      console.error('Error fetching IP:', error)
      
      // Fallback to session-based ID
      let sessionId = sessionStorage.getItem('hackathon-session')
      if (!sessionId) {
        sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
        sessionStorage.setItem('hackathon-session', sessionId)
      }
      
      return {
        ipAddress: 'Unknown',
        sessionId,
        userAgent: navigator.userAgent,
        displayName: `User #${sessionId.slice(-4)}`,
        location: 'Unknown Location'
      }
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize user info and load chat history on mount
  useEffect(() => {
    const initializeUser = async () => {
      console.log('Fetching user IP address...')
      const info = await getUserInfo()
      setUserInfo(info)
      console.log('User Info Detected:', info)
      
      // Load chat history after getting user info (IP-based)
      await loadChatHistory(loadHistory)
    }
    
    // Initialize speech recognition
    initializeSpeechRecognition()
    
    // Check user profile first
    checkUserProfile()
    
    initializeUser()
    
    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  // Countdown timer logic
  useEffect(() => {
    // Set fixed hackathon end time - CUSTOMIZE THIS DATE AND TIME
    // Format: 'YYYY-MM-DDTHH:MM:SS' (24-hour format)
    // Example: '2024-12-20T18:00:00' = December 20, 2024 at 6:00 PM
    const hackathonEnd = new Date('2025-10-13T18:00:00')
    
    const updateCountdown = () => {
      const now = new Date()
      const difference = hackathonEnd.getTime() - now.getTime()
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)
        
        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`)
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
        } else {
          setTimeLeft(`${minutes}m ${seconds}s`)
        }
      } else {
        setTimeLeft('Hackathon Ended!')
      }
    }
    
    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    
    return () => clearInterval(timer)
  }, [])


  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    // Stop voice recording if active
    if (isRecording) {
      stopRecording()
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: inputMessage,
          sessionId: userInfo.sessionId 
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Check if the API returned an error
      if (data.error) {
        throw new Error(data.message || 'API returned an error')
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        role: 'bot',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      
      let errorText = 'Sorry, I encountered an error. '
      
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorText += 'Unable to connect to the server. Please check your connection and try again.'
        } else if (error.message.includes('LM Studio') || error.message.includes('AI service')) {
          errorText += error.message
        } else if (error.message.includes('HTTP error')) {
          errorText += 'Server error occurred. Please try again.'
        } else {
          errorText += 'Please make sure LM Studio is running on localhost:1234 with a model loaded.'
        }
      } else {
        errorText += 'Please make sure LM Studio is running and try again.'
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: errorText,
        role: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      // Stop voice recording if active before sending
      if (isRecording) {
        stopRecording()
      }
      sendMessage()
    }
  }

  const predefinedPrompts = [
    {
      icon: faLightbulb,
      title: "Topics",
      prompt: "What are all the topics included in the hackathon"
    },
    {
      icon: faBug,
      title: "Deployment Options",
      prompt: "Help me debug this code issue: "
    },
    {
      icon: faRocket,
      title: "Team Structure",
      prompt: "What's the best tech stack for building a web app in 48 hours?"
    },
    {
      icon: faBolt,
      title: "Quick Setup",
      prompt: "How do I quickly set up a React app with API integration?"
    },
    {
      icon: faTrophy,
      title: "Best Practices",
      prompt: "What are the key best practices for winning a hackathon?"
    },
    {
      icon: faWrench,
      title: "Code Review",
      prompt: "Review my code and suggest improvements: "
    }
  ]

  const handlePredefinedPrompt = (prompt: string) => {
    setInputMessage(prompt)
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-white to-gray-50 flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-brand-white shadow-lg border-b-2 border-brand-red">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
              </div>
                  <div>
                    <h1 className="text-3xl font-open-sans  text-[#d71e28] tracking-tight">Hackathon Bot</h1>
                    <p className="text-sm text-gray-700 font-medium">
                      {profileData ? (
                        <span className="text-brand-red ml-2">Welcome, {profileData.user_name}! ({profileData.team_name})</span>
                      ) : userInfo.displayName ? (
                        <span className="text-brand-red ml-2">
                          Welcome, {userInfo.displayName}! {userInfo.location && `(${userInfo.location})`}
                        </span>
                      ) : (
                        <span className="text-gray-500 ml-2">
                          Identifying user...
                        </span>
                      )}
                    </p>
                  </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Navigation Menu */}
              <div className="flex items-center space-x-1">
                <Link href="/leaderboard">
                  <div className="group flex flex-col items-center justify-center px-4 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer min-w-[80px]">
                    <FontAwesomeIcon 
                      icon={faTrophy} 
                      className="h-5 w-5 text-brand-red group-hover:text-red-600 transition-colors duration-200 mb-1" 
                    />
                    <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                      Leaderboard
                    </span>
                  </div>
                </Link>
                
                <div 
                  onClick={handleAdminAccess}
                  className="group flex flex-col items-center justify-center px-4 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer min-w-[80px]"
                >
                  <FontAwesomeIcon 
                    icon={faWrench} 
                    className="h-5 w-5 text-brand-red group-hover:text-red-600 transition-colors duration-200 mb-1" 
                  />
                  <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                    Admin
                  </span>
                </div>
              </div>

              {/* Countdown Timer */}
              <div className="flex items-center space-x-2">
                <FontAwesomeIcon icon={faClock} className="h-4 w-4 text-brand-red" />
                <div className="text-brand-red">
                  <div className="text-xs font-medium uppercase tracking-wide hidden sm:block">Time Left</div>
                  <div className="text-sm sm:text-lg font-bold font-mono">{timeLeft || 'Loading...'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Code Modal */}
      {showAdminCodeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faWrench} className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Admin Access</h2>
              <p className="text-gray-600 mt-2">Enter the admin code to continue</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <input
                  type="password"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && verifyAdminCode()}
                  placeholder="Enter admin code"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-center text-lg tracking-wider"
                  maxLength={4}
                  autoFocus
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={closeAdminModal}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={verifyAdminCode}
                  disabled={!adminCode.trim()}
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Access Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Registration Modal */}
      {showRegistration && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-red to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faUser} className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Hackathon Bot!</h2>
              <p className="text-gray-600">Let's get to know you and your team</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={registrationForm.userName}
                  onChange={(e) => setRegistrationForm(prev => ({ ...prev, userName: e.target.value }))}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={registrationForm.teamName}
                  onChange={(e) => setRegistrationForm(prev => ({ ...prev, teamName: e.target.value }))}
                  placeholder="Enter your team name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={registrationForm.email}
                  onChange={(e) => setRegistrationForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your.email@company.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role (Optional)
                </label>
                <select
                  value={registrationForm.role}
                  onChange={(e) => setRegistrationForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red"
                >
                  <option value="">Select your role</option>
                  <option value="Developer">Developer</option>
                  <option value="Designer">Designer</option>
                  <option value="Data Scientist">Data Scientist</option>
                  <option value="Product Manager">Product Manager</option>
                  <option value="DevOps Engineer">DevOps Engineer</option>
                  <option value="Business Analyst">Business Analyst</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="mt-6 pt-4">
              <button
                onClick={createUserProfile}
                disabled={!registrationForm.userName.trim() || !registrationForm.teamName.trim()}
                className="w-full bg-gradient-to-r from-brand-red to-red-600 text-white py-3 px-6 rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                Start Hacking! 🚀
              </button>
              
              <p className="text-xs text-gray-500 text-center mt-3">
                This information is stored locally and associated with your IP address
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 pt-24">
          <div className="bg-brand-white rounded-xl shadow-lg border border-gray-200 h-full flex flex-col">
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {isLoadingHistory ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-gray-500 text-sm">Loading chat history...</div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
                  >
                    <div className={`flex items-start space-x-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user' 
                          ? 'bg-brand-red' 
                          : 'bg-brand-yellow'
                      }`}>
                        {message.role === 'user' ? (
                          <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-white" />
                        ) : (
                          <FontAwesomeIcon icon={faRobot} className="h-4 w-4 text-gray-800" />
                        )}
                      </div>
                      <div className={`rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-brand-red text-white'
                          : 'bg-gray-50 text-gray-800 border border-gray-200'
                      }`}>
                    {message.role === 'bot' ? (
                      <div className="markdown-content">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            table: ({ children }) => (
                              <div className="overflow-x-auto mb-4">
                                <table className="min-w-full divide-y divide-gray-200 border border-gray-300 rounded-lg">
                                  {children}
                                </table>
                              </div>
                            ),
                            thead: ({ children }) => (
                              <thead className="bg-gray-50">{children}</thead>
                            ),
                            th: ({ children }) => (
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                {children}
                              </th>
                            ),
                            td: ({ children }) => (
                              <td className="px-3 py-2 text-sm text-gray-800 border-b border-gray-100">
                                {children}
                              </td>
                            ),
                            code: ({ children, className }) => {
                              const isInline = !className?.includes('language-')
                              return isInline ? (
                                <code className="bg-gray-200 text-gray-800 px-1 py-0.5 rounded text-sm font-mono">
                                  {children}
                                </code>
                              ) : (
                                <pre className="bg-gray-100 border rounded-lg p-3 overflow-x-auto mb-4">
                                  <code className="text-sm font-mono text-gray-800">{children}</code>
                                </pre>
                              )
                            },
                            h1: ({ children }) => (
                              <h1 className="text-lg font-bold text-gray-900 mt-4 mb-2">{children}</h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-base font-semibold text-gray-900 mt-3 mb-2">{children}</h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-sm font-semibold text-gray-900 mt-2 mb-1">{children}</h3>
                            ),
                            p: ({ children }) => (
                              <p className="text-sm text-gray-800 mb-2 leading-relaxed">{children}</p>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc list-inside text-sm text-gray-800 mb-2 space-y-1">{children}</ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal list-inside text-sm text-gray-800 mb-2 space-y-1">{children}</ol>
                            ),
                            li: ({ children }) => (
                              <li className="text-sm text-gray-800">{children}</li>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold text-gray-900">{children}</strong>
                            ),
                            em: ({ children }) => (
                              <em className="italic text-gray-800">{children}</em>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-700 mb-2">
                                {children}
                              </blockquote>
                            ),
                            a: ({ children, href }) => {
                              const isExternalLink = href?.startsWith('http')
                              const isEmail = href?.startsWith('mailto:')
                              const isPhoneNumber = href?.startsWith('tel:')
                              
                              // Smart display text handling
                              let displayText = children
                              let linkType = ''
                              
                              if (typeof children === 'string') {
                                if (children.length > 60) {
                                  // For very long URLs, show domain + "click here"
                                  try {
                                    const urlObj = new URL(href || '')
                                    const domain = urlObj.hostname.replace('www.', '')
                                    displayText = `${domain} (click here)`
                                  } catch {
                                    displayText = `${children.substring(0, 40)}... (click here)`
                                  }
                                } else if (children.length > 40) {
                                  displayText = `${children.substring(0, 30)}...`
                                }
                              }
                              
                              if (isExternalLink) linkType = '↗'
                              if (isEmail) linkType = '✉'
                              if (isPhoneNumber) linkType = '📞'
                              
                              return (
                                <a
                                  href={href}
                                  target={isExternalLink ? '_blank' : '_self'}
                                  rel={isExternalLink ? 'noopener noreferrer' : undefined}
                                  className={`
                                    ${isExternalLink ? 'text-blue-600 hover:text-blue-800' : ''}
                                    ${isEmail ? 'text-green-600 hover:text-green-800' : ''}
                                    ${isPhoneNumber ? 'text-purple-600 hover:text-purple-800' : ''}
                                    ${!isExternalLink && !isEmail && !isPhoneNumber ? 'text-blue-600 hover:text-blue-800' : ''}
                                    underline decoration-current/30 hover:decoration-current 
                                    transition-colors duration-200 break-words
                                    hover:bg-blue-50 px-1 py-0.5 rounded
                                  `}
                                  title={`${linkType} ${href}`}
                                >
                                  {displayText}
                                  {linkType && (
                                    <span className="inline-block ml-1 text-xs opacity-70">
                                      {linkType}
                                    </span>
                                  )}
                                </a>
                              )
                            }
                          }}
                        >
                          {linkifyText(message.content)}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    )}
                    <p className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-red-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            
            {isLoading && (
              <div className="flex justify-start animate-slide-up">
                <div className="flex items-start space-x-3 max-w-[80%]">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-yellow flex items-center justify-center">
                    <FontAwesomeIcon icon={faRobot} className="h-4 w-4 text-gray-800" />
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
                    <div className="typing-indicator">
                      <div className="typing-dot animation-delay-0"></div>
                      <div className="typing-dot animation-delay-200"></div>
                      <div className="typing-dot animation-delay-400"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Predefined Prompts */}
          {(messages.length <= 1 || showPrompts) && (
            <div className="border-t border-gray-100 px-4 py-3 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">Quick Start Prompts:</h3>
                {messages.length > 1 && (
                  <button
                    onClick={() => setShowPrompts(false)}
                    className="text-xs text-gray-500 hover:text-brand-red transition-colors"
                  >
                    Hide
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {predefinedPrompts.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      handlePredefinedPrompt(item.prompt)
                      setShowPrompts(false)
                    }}
                    className="flex items-center space-x-2 p-3 text-left bg-gray-50 hover:bg-brand-yellow/20 rounded-lg transition-colors duration-200 border border-gray-200 hover:border-brand-yellow group"
                  >
                    <div className="text-lg group-hover:scale-110 transition-transform duration-200 text-brand-red">
                      <FontAwesomeIcon icon={item.icon} className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-brand-red">
                      {item.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

              {/* Debug Info Panel */}
              {userInfo.sessionId && (
                <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
                  <details className="text-xs text-gray-600">
                    <summary className="cursor-pointer hover:text-brand-red">🔍 Debug: User Info</summary>
                    <div className="mt-2 space-y-1 font-mono">
                      <div><strong>IP Address:</strong> {userInfo.ipAddress}</div>
                      <div><strong>Location:</strong> {userInfo.location}</div>
                      <div><strong>Session ID:</strong> {userInfo.sessionId}</div>
                      <div><strong>Display Name:</strong> {userInfo.displayName}</div>
                      <div><strong>User Agent:</strong> {userInfo.userAgent}</div>
                    </div>
                  </details>
                </div>
              )}

              {/* Input Area */}
              <div className="border-t border-gray-200 p-4">
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your hackathon project..."
                  className="w-full resize-none border border-gray-300 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red"
                  rows={1}
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                />
              </div>
              {speechSupported && (
                <button
                  onClick={toggleRecording}
                  disabled={isLoading}
                  className={`group relative w-12 h-12 rounded-xl transition-all duration-200 ${
                    isRecording 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={isRecording ? "Stop recording" : "Start voice input"}
                >
                  <FontAwesomeIcon 
                    icon={isRecording ? faStop : faMicrophone} 
                    className="h-4 w-4 transition-all duration-200" 
                  />
                  {isRecording && (
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-300 rounded-full animate-pulse"></div>
                  )}
                </button>
              )}
              {messages.length > 1 && !showPrompts && (
                <button
                  onClick={() => setShowPrompts(true)}
                  className="group relative w-12 h-12 rounded-xl bg-brand-yellow/15 text-brand-red hover:bg-brand-yellow/25 border border-brand-yellow/20 transition-all duration-200"
                  title="Show quick prompts"
                >
                  <FontAwesomeIcon 
                    icon={faLightbulb} 
                    className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" 
                  />
                </button>
              )}
              
              {/* Load History Toggle Button */}
              <button
                onClick={() => handleHistoryToggle(!loadHistory)}
                className={`group relative w-12 h-12 rounded-xl transition-all duration-200 ${
                  loadHistory 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                }`}
                title={loadHistory ? "History loaded (click to start fresh)" : "History disabled (click to load)"}
              >
                <FontAwesomeIcon 
                  icon={faHistory} 
                  className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" 
                />
                {loadHistory && (
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-300 rounded-full"></div>
                )}
              </button>
              
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className={`group relative w-12 h-12 rounded-xl transition-all duration-200 ${
                  inputMessage.trim() && !isLoading
                    ? 'bg-brand-red text-white hover:bg-red-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <FontAwesomeIcon 
                  icon={faPaperPlane} 
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" 
                />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {isRecording ? (
                <span className="text-red-500 font-medium animate-pulse">
                  🎤 Recording... Click microphone to stop
                </span>
              ) : (
                <>
                  Press Enter to send • Shift + Enter for new line
                  {speechSupported && (
                    <span className="block sm:inline sm:ml-2">
                      • Click 🎤 for voice input
                    </span>
                  )}
                </>
              )}
            </p>
          </div>
        </div>
      </main>
     
    </div>
  )
}
