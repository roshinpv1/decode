'use client'

import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUsers,
  faCalendar,
  faPlus,
  faEdit,
  faTrash,
  faHome,
  faTrophy,
  faBullhorn,
  faChartLine,
  faDatabase,
  faArrowsRotate,
  faFloppyDisk,
  faXmark,
  faCheck,
  faExclamationTriangle,
  faInfoCircle,
  faCrown,
  faDiagramProject,
  faCodeBranch,
  faLightbulb,
  faBrain
} from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'

interface Team {
  id: number
  team_name: string
  members: string
  project_name?: string
  project_description?: string
  github_repo?: string
  score: number
  created_at: string
  updated_at: string
}

interface Event {
  id: number
  title: string
  description: string
  event_type: 'announcement' | 'schedule_change' | 'deadline' | 'info'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  start_time?: string
  end_time?: string
  is_active: boolean
  created_at: string
  created_by: string
}

interface Prompt {
  id: number
  title: string
  prompt: string
  icon: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

interface SystemPrompt {
  id: number
  name: string
  content: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'teams' | 'events' | 'prompts' | 'system-prompts' | 'stats'>('teams')
  const [teams, setTeams] = useState<Team[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([])
  const [systemPromptContent, setSystemPromptContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>({})
  
  // Form states
  const [showTeamForm, setShowTeamForm] = useState(false)
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [editingPrompts, setEditingPrompts] = useState(false)
  const [editingSystemPrompt, setEditingSystemPrompt] = useState(false)
  
  const [teamForm, setTeamForm] = useState({
    team_name: '',
    members: '',
    project_name: '',
    project_description: '',
    github_repo: '',
    score: 0
  })
  
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    event_type: 'info' as Event['event_type'],
    priority: 'medium' as Event['priority'],
    start_time: '',
    end_time: ''
  })

  // Fetch data
  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/leaderboard?limit=50')
      const data = await response.json()
      setTeams(data.leaderboard || [])
    } catch (error) {
      console.error('Failed to fetch teams:', error)
    }
  }

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events?type=active&limit=50')
      const data = await response.json()
      setEvents(data.events || [])
    } catch (error) {
      console.error('Failed to fetch events:', error)
    }
  }

  const fetchPrompts = async () => {
    try {
      const response = await fetch('/api/prompts')
      const data = await response.json()
      setPrompts(data.prompts || [])
    } catch (error) {
      console.error('Failed to fetch prompts:', error)
    }
  }

  const fetchSystemPrompts = async () => {
    try {
      const response = await fetch('/api/system-prompts')
      const data = await response.json()
      setSystemPrompts(data.systemPrompts || [])
      
      // Load the default system prompt content for editing
      if (data.systemPrompts && data.systemPrompts.length > 0) {
        const defaultPrompt = data.systemPrompts.find((sp: SystemPrompt) => sp.name === 'default')
        if (defaultPrompt) {
          setSystemPromptContent(defaultPrompt.content)
        }
      } else {
        // If no system prompts exist, fetch the default from the API
        const defaultResponse = await fetch('/api/system-prompts?name=default')
        const defaultData = await defaultResponse.json()
        setSystemPromptContent(defaultData.content || '')
      }
    } catch (error) {
      console.error('Failed to fetch system prompts:', error)
    }
  }

  const fetchStats = async () => {
    try {
      // This would come from a stats API endpoint
      setStats({
        totalTeams: teams.length,
        totalEvents: events.length,
        activeEvents: events.filter(e => e.is_active).length,
        totalMessages: 47,
        uniqueUsers: 12
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchTeams(), fetchEvents(), fetchPrompts(), fetchSystemPrompts()])
      setLoading(false)
    }
    loadData()
  }, [])

  useEffect(() => {
    if (teams.length > 0 || events.length > 0) {
      fetchStats()
    }
  }, [teams, events])

  // Team management
  const handleCreateTeam = async () => {
    try {
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_team',
          teamName: teamForm.team_name,
          members: teamForm.members.split(',').map(m => m.trim()),
          projectName: teamForm.project_name,
          projectDescription: teamForm.project_description
        })
      })
      
      if (response.ok) {
        await fetchTeams()
        setShowTeamForm(false)
        resetTeamForm()
      }
    } catch (error) {
      console.error('Failed to create team:', error)
    }
  }

  const handleUpdateTeamScore = async (teamId: number, newScore: number) => {
    try {
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_score',
          teamId,
          score: newScore
        })
      })
      
      if (response.ok) {
        await fetchTeams()
      }
    } catch (error) {
      console.error('Failed to update team score:', error)
    }
  }

  // Event management
  const handleCreateEvent = async () => {
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          ...eventForm,
          createdBy: 'admin'
        })
      })
      
      if (response.ok) {
        await fetchEvents()
        setShowEventForm(false)
        resetEventForm()
      }
    } catch (error) {
      console.error('Failed to create event:', error)
    }
  }

  const handleDeactivateEvent = async (eventId: number) => {
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deactivate',
          eventId
        })
      })
      
      if (response.ok) {
        await fetchEvents()
      }
    } catch (error) {
      console.error('Failed to deactivate event:', error)
    }
  }

  const resetTeamForm = () => {
    setTeamForm({
      team_name: '',
      members: '',
      project_name: '',
      project_description: '',
      github_repo: '',
      score: 0
    })
    setEditingTeam(null)
  }

  const resetEventForm = () => {
    setEventForm({
      title: '',
      description: '',
      event_type: 'info',
      priority: 'medium',
      start_time: '',
      end_time: ''
    })
    setEditingEvent(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-white to-gray-50">
      {/* Header */}
      <header className="bg-brand-white shadow-lg border-b-2 border-brand-red">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <FontAwesomeIcon icon={faDatabase} className="h-8 w-8 text-brand-red" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Hackathon Admin</h1>
                <p className="text-gray-600">Manage teams, events, and portal settings</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/leaderboard">
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
                  <FontAwesomeIcon icon={faTrophy} className="h-4 w-4" />
                  <span>Leaderboard</span>
                </button>
              </Link>
              
              <Link href="/">
                <button className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all">
                  <FontAwesomeIcon icon={faHome} className="h-4 w-4" />
                  <span>Back to Chat</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('teams')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'teams'
                  ? 'border-brand-red text-brand-red'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faUsers} className="mr-2" />
              Teams ({teams.length})
            </button>
            
            <button
              onClick={() => setActiveTab('events')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'events'
                  ? 'border-brand-red text-brand-red'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faCalendar} className="mr-2" />
              Events ({events.length})
            </button>
            
            <button
              onClick={() => setActiveTab('prompts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'prompts'
                  ? 'border-brand-red text-brand-red'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faLightbulb} className="mr-2" />
              Prompts ({prompts.length})
            </button>
            
            <button
              onClick={() => setActiveTab('system-prompts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'system-prompts'
                  ? 'border-brand-red text-brand-red'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faBrain} className="mr-2" />
              System Prompt
            </button>
            
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'stats'
                  ? 'border-brand-red text-brand-red'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faChartLine} className="mr-2" />
              Statistics
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
          </div>
        ) : (
          <>
            {/* Teams Tab */}
            {activeTab === 'teams' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Team Management</h2>
                  <button
                    onClick={() => setShowTeamForm(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-red-600 transition-all"
                  >
                    <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
                    <span>Add Team</span>
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Team
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Members
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Project
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {teams.map((team, index) => (
                        <tr key={team.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {index < 3 && (
                                <FontAwesomeIcon 
                                  icon={index === 0 ? faCrown : index === 1 ? faTrophy : faDiagramProject} 
                                  className={`h-4 w-4 mr-2 ${
                                    index === 0 ? 'text-yellow-500' : 
                                    index === 1 ? 'text-gray-400' : 'text-orange-500'
                                  }`} 
                                />
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">{team.team_name}</div>
                                <div className="text-sm text-gray-500">Rank #{index + 1}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {Array.isArray(team.members) ? team.members.join(', ') : team.members}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{team.project_name || 'N/A'}</div>
                            {team.project_description && (
                              <div className="text-sm text-gray-500 max-w-xs truncate">
                                {team.project_description}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              value={team.score}
                              onChange={(e) => handleUpdateTeamScore(team.id, parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                setEditingTeam(team)
                                setTeamForm({
                                  team_name: team.team_name,
                                  members: Array.isArray(team.members) ? team.members.join(', ') : team.members,
                                  project_name: team.project_name || '',
                                  project_description: team.project_description || '',
                                  github_repo: team.github_repo || '',
                                  score: team.score
                                })
                                setShowTeamForm(true)
                              }}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Event Management</h2>
                  <button
                    onClick={() => setShowEventForm(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-red-600 transition-all"
                  >
                    <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
                    <span>Add Event</span>
                  </button>
                </div>

                <div className="grid gap-4">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        event.priority === 'urgent' ? 'border-red-500 bg-red-50' :
                        event.priority === 'high' ? 'border-orange-500 bg-orange-50' :
                        event.priority === 'medium' ? 'border-blue-500 bg-blue-50' :
                        'border-gray-500 bg-gray-50'
                      } ${!event.is_active ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <FontAwesomeIcon 
                              icon={
                                event.event_type === 'announcement' ? faBullhorn :
                                event.event_type === 'deadline' ? faExclamationTriangle :
                                event.event_type === 'schedule_change' ? faCalendar :
                                faInfoCircle
                              }
                              className="h-4 w-4"
                            />
                            <h3 className="text-lg font-semibold">{event.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              event.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                              event.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              event.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {event.priority}
                            </span>
                          </div>
                          <p className="text-gray-700 mb-2">{event.description}</p>
                          <div className="text-sm text-gray-500">
                            Created {new Date(event.created_at).toLocaleString()}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          {event.is_active && (
                            <button
                              onClick={() => handleDeactivateEvent(event.id)}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-all"
                            >
                              <FontAwesomeIcon icon={faXmark} className="mr-1" />
                              Deactivate
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prompts Tab */}
            {activeTab === 'prompts' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Prompt Management</h2>
                  <button
                    onClick={() => setEditingPrompts(!editingPrompts)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                      editingPrompts 
                        ? 'bg-gray-600 text-white hover:bg-gray-700' 
                        : 'bg-brand-red text-white hover:bg-red-600'
                    }`}
                  >
                    <FontAwesomeIcon icon={editingPrompts ? faXmark : faEdit} className="h-4 w-4" />
                    <span>{editingPrompts ? 'Cancel' : 'Edit Prompts'}</span>
                  </button>
                </div>

                {!editingPrompts ? (
                  // View Mode
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {prompts.map((prompt, index) => (
                      <div key={prompt.id} className="bg-white p-6 rounded-lg shadow border border-gray-200">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-brand-yellow/20 rounded-lg flex items-center justify-center">
                            <FontAwesomeIcon icon={faLightbulb} className="h-5 w-5 text-brand-red" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 mb-2">{prompt.title}</h3>
                            <p className="text-sm text-gray-600 line-clamp-3">{prompt.prompt}</p>
                            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                              <span>Order: {prompt.sort_order}</span>
                              <span>{prompt.is_active ? 'Active' : 'Inactive'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800 text-sm">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                        You can modify the prompts below. Changes will be saved to the database and affect the chat interface immediately.
                      </p>
                    </div>
                    
                    {prompts.map((prompt, index) => (
                      <div key={prompt.id} className="bg-white p-6 rounded-lg shadow border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input
                              type="text"
                              value={prompt.title}
                              onChange={(e) => {
                                const updatedPrompts = [...prompts]
                                updatedPrompts[index].title = e.target.value
                                setPrompts(updatedPrompts)
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-brand-red"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Prompt Text</label>
                            <textarea
                              value={prompt.prompt}
                              onChange={(e) => {
                                const updatedPrompts = [...prompts]
                                updatedPrompts[index].prompt = e.target.value
                                setPrompts(updatedPrompts)
                              }}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-brand-red"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setEditingPrompts(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/prompts', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ prompts: prompts.map(p => ({
                                title: p.title,
                                prompt: p.prompt,
                                icon: p.icon,
                                sort_order: p.sort_order
                              })) })
                            })
                            
                            if (response.ok) {
                              setEditingPrompts(false)
                              alert('Prompts updated successfully!')
                            } else {
                              alert('Failed to update prompts')
                            }
                          } catch (error) {
                            console.error('Error updating prompts:', error)
                            alert('Error updating prompts')
                          }
                        }}
                        className="px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <FontAwesomeIcon icon={faFloppyDisk} className="mr-2" />
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* System Prompts Tab */}
            {activeTab === 'system-prompts' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">System Prompt Management</h2>
                  <button
                    onClick={() => setEditingSystemPrompt(!editingSystemPrompt)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                      editingSystemPrompt 
                        ? 'bg-gray-600 text-white hover:bg-gray-700' 
                        : 'bg-brand-red text-white hover:bg-red-600'
                    }`}
                  >
                    <FontAwesomeIcon icon={editingSystemPrompt ? faXmark : faEdit} className="h-4 w-4" />
                    <span>{editingSystemPrompt ? 'Cancel' : 'Edit System Prompt'}</span>
                  </button>
                </div>

                {!editingSystemPrompt ? (
                  // View Mode
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-800 text-sm">
                        <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
                        The system prompt defines the AI assistant's behavior and knowledge base. This prompt is sent to LM Studio before every conversation.
                      </p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                      <div className="flex items-start space-x-3 mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <FontAwesomeIcon icon={faBrain} className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">Default System Prompt</h3>
                          <p className="text-sm text-gray-600">Controls how the AI assistant behaves and responds to users</p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                        <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                          {systemPromptContent}
                        </pre>
                      </div>
                      
                      <div className="mt-4 text-xs text-gray-500">
                        {systemPromptContent.length} characters • Last updated: {
                          systemPrompts.find(sp => sp.name === 'default')?.updated_at || 'Never'
                        }
                      </div>
                    </div>
                  </div>
                ) : (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800 text-sm">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                        Warning: Changes to the system prompt will immediately affect all future conversations with the AI assistant.
                      </p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            System Prompt Content
                          </label>
                          <textarea
                            value={systemPromptContent}
                            onChange={(e) => setSystemPromptContent(e.target.value)}
                            rows={20}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-brand-red font-mono text-sm"
                            placeholder="Enter the system prompt that will guide the AI assistant's behavior..."
                          />
                        </div>
                        
                        <div className="text-sm text-gray-500">
                          {systemPromptContent.length} characters
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => {
                          setEditingSystemPrompt(false)
                          // Reset to original content
                          const original = systemPrompts.find(sp => sp.name === 'default')?.content || ''
                          setSystemPromptContent(original)
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/system-prompts', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ 
                                name: 'default',
                                content: systemPromptContent
                              })
                            })
                            
                            if (response.ok) {
                              setEditingSystemPrompt(false)
                              await fetchSystemPrompts() // Refresh data
                              alert('System prompt updated successfully!')
                            } else {
                              alert('Failed to update system prompt')
                            }
                          } catch (error) {
                            console.error('Error updating system prompt:', error)
                            alert('Error updating system prompt')
                          }
                        }}
                        disabled={!systemPromptContent.trim()}
                        className="px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FontAwesomeIcon icon={faFloppyDisk} className="mr-2" />
                        Save System Prompt
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === 'stats' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Hackathon Statistics</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faUsers} className="h-8 w-8 text-blue-500" />
                      <div className="ml-4">
                        <p className="text-2xl font-bold text-gray-900">{stats.totalTeams}</p>
                        <p className="text-gray-600">Total Teams</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faCalendar} className="h-8 w-8 text-green-500" />
                      <div className="ml-4">
                        <p className="text-2xl font-bold text-gray-900">{stats.activeEvents}</p>
                        <p className="text-gray-600">Active Events</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faChartLine} className="h-8 w-8 text-purple-500" />
                      <div className="ml-4">
                        <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
                        <p className="text-gray-600">Chat Messages</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faDatabase} className="h-8 w-8 text-red-500" />
                      <div className="ml-4">
                        <p className="text-2xl font-bold text-gray-900">{stats.uniqueUsers}</p>
                        <p className="text-gray-600">Unique Users</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Team Form Modal */}
      {showTeamForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">
                {editingTeam ? 'Edit Team' : 'Add New Team'}
              </h3>
              <button
                onClick={() => {
                  setShowTeamForm(false)
                  resetTeamForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                <input
                  type="text"
                  value={teamForm.team_name}
                  onChange={(e) => setTeamForm(prev => ({ ...prev, team_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Members (comma-separated)</label>
                <input
                  type="text"
                  value={teamForm.members}
                  onChange={(e) => setTeamForm(prev => ({ ...prev, members: e.target.value }))}
                  placeholder="John Doe, Jane Smith, Bob Johnson"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input
                  type="text"
                  value={teamForm.project_name}
                  onChange={(e) => setTeamForm(prev => ({ ...prev, project_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Score</label>
                <input
                  type="number"
                  value={teamForm.score}
                  onChange={(e) => setTeamForm(prev => ({ ...prev, score: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red"
                />
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                onClick={handleCreateTeam}
                className="flex-1 bg-brand-red text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-all"
              >
                <FontAwesomeIcon icon={faFloppyDisk} className="mr-2" />
                {editingTeam ? 'Update' : 'Create'} Team
              </button>
              <button
                onClick={() => {
                  setShowTeamForm(false)
                  resetTeamForm()
                }}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Form Modal */}
      {showEventForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Add New Event</h3>
              <button
                onClick={() => {
                  setShowEventForm(false)
                  resetEventForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={eventForm.event_type}
                    onChange={(e) => setEventForm(prev => ({ ...prev, event_type: e.target.value as Event['event_type'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red"
                  >
                    <option value="info">Info</option>
                    <option value="announcement">Announcement</option>
                    <option value="schedule_change">Schedule Change</option>
                    <option value="deadline">Deadline</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={eventForm.priority}
                    onChange={(e) => setEventForm(prev => ({ ...prev, priority: e.target.value as Event['priority'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                onClick={handleCreateEvent}
                className="flex-1 bg-brand-red text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-all"
              >
                <FontAwesomeIcon icon={faFloppyDisk} className="mr-2" />
                Create Event
              </button>
              <button
                onClick={() => {
                  setShowEventForm(false)
                  resetEventForm()
                }}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
