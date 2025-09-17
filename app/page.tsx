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
  faClock
} from '@fortawesome/free-solid-svg-icons'
import Image from 'next/image'
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
        body: JSON.stringify({ message: inputMessage }),
      })

      const data = await response.json()

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        role: 'bot',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please make sure LM Studio is running and try again.',
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
                <p className="text-sm text-gray-700 font-medium">Let the hacking begin!</p>
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
      </header>

      {/* Chat Messages */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 pt-24">
        <div className="bg-brand-white rounded-xl shadow-lg border border-gray-200 h-full flex flex-col">
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((message) => (
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
                            )
                          }}
                        >
                          {message.content}
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
            ))}
            
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
              {messages.length > 1 && !showPrompts && (
                <button
                  onClick={() => setShowPrompts(true)}
                  className="bg-brand-yellow/20 text-brand-red p-3 rounded-xl hover:bg-brand-yellow/30 transition-all duration-200 shadow-sm hover:shadow-md border border-brand-yellow"
                  title="Show quick prompts"
                >
                  <FontAwesomeIcon icon={faLightbulb} className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-gradient-to-r from-brand-red to-brand-red/90 text-white p-3 rounded-xl hover:from-brand-red/90 hover:to-brand-red transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                <FontAwesomeIcon icon={faPaperPlane} className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Press Enter to send • Shift + Enter for new line
            </p>
          </div>
        </div>
      </main>

     
    </div>
  )
}
