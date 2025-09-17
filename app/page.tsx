'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Zap, Lightbulb } from 'lucide-react'
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
      icon: "💡",
      title: "Topics",
      prompt: "What are all the topics included in the hackathon"
    },
    {
      icon: "🐛",
      title: "Deployment Options",
      prompt: "Help me debug this code issue: "
    },
    {
      icon: "🚀",
      title: "Team Structure",
      prompt: "What's the best tech stack for building a web app in 48 hours?"
    },
    {
      icon: "⚡",
      title: "Quick Setup",
      prompt: "How do I quickly set up a React app with API integration?"
    },
    {
      icon: "🏆",
      title: "Best Practices",
      prompt: "What are the key best practices for winning a hackathon?"
    },
    {
      icon: "🔧",
      title: "Code Review",
      prompt: "Review my code and suggest improvements: "
    }
  ]

  const handlePredefinedPrompt = (prompt: string) => {
    setInputMessage(prompt)
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <Image
                src="/icon.png"
                alt="CCPMT DECODE Logo"
                width={80}
                height={40}
                className=""
              />
            </div>
            <div>
              <h1 className="text-3xl font-helvetica font-bold bg-gradient-to-r from-yellow-900 via-blue-900 to-purple-900 bg-clip-text text-transparent tracking-tight">Hackathon Bot</h1>
              <p className="text-sm text-gray-600 font-medium">Let the hacking begin!</p>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-lg h-full flex flex-col">
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
              >
                <div className={`flex items-start space-x-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-blue-500' 
                      : 'bg-gradient-to-r from-purple-500 to-pink-500'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
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
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
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
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
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
                    className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
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
                    className="flex items-center space-x-2 p-3 text-left bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors duration-200 border border-transparent hover:border-blue-200 group"
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform duration-200">
                      {item.icon}
                    </span>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
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
                  className="w-full resize-none border border-gray-300 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={1}
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                />
              </div>
              {messages.length > 1 && !showPrompts && (
                <button
                  onClick={() => setShowPrompts(true)}
                  className="bg-gray-100 text-gray-600 p-3 rounded-xl hover:bg-gray-200 transition-all duration-200 shadow-sm hover:shadow-md"
                  title="Show quick prompts"
                >
                  <Lightbulb className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Press Enter to send • Shift + Enter for new line
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-600">
            Wells Fargo | CCPMT <code className="bg-gray-100 px-2 py-1 rounded"></code> 
          </p>
        </div>
      </footer>
    </div>
  )
}
