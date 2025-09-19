'use client'

import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faTrophy,
  faCrown,
  faMedal,
  faAward,
  faUsers,
  faCalendar,
  faClock,
  faArrowsRotate,
  faHome,
  faChartLine,
  faCodeBranch,
  faDiagramProject
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

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [refreshing, setRefreshing] = useState(false)

  // Fetch leaderboard data
  const fetchLeaderboard = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/leaderboard?limit=20')
      const data = await response.json()
      setLeaderboard(data.leaderboard || [])
      setLastUpdated(new Date().toLocaleTimeString())
      console.log('📊 Leaderboard loaded:', data.leaderboard?.length || 0, 'teams')
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
      setLeaderboard([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchLeaderboard()
    const interval = setInterval(fetchLeaderboard, 30000)
    return () => clearInterval(interval)
  }, [])

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <FontAwesomeIcon icon={faCrown} className="h-6 w-6 text-yellow-500" />
      case 1:
        return <FontAwesomeIcon icon={faMedal} className="h-6 w-6 text-gray-400" />
      case 2:
        return <FontAwesomeIcon icon={faAward} className="h-6 w-6 text-orange-500" />
      default:
        return <span className="text-2xl font-bold text-gray-600">#{index + 1}</span>
    }
  }

  const getRankStyle = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-lg transform scale-105'
      case 1:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white shadow-md'
      case 2:
        return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-md'
      default:
        return 'bg-white border border-gray-200 hover:bg-gray-50'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-white to-gray-50">
      {/* Header */}
      <header className="bg-brand-white shadow-lg border-b-2 border-brand-red">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <FontAwesomeIcon icon={faTrophy} className="h-8 w-8 text-brand-red" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Hackathon Leaderboard</h1>
                <p className="text-gray-600">Real-time team rankings and scores</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchLeaderboard}
                disabled={refreshing}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  refreshing 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-brand-red text-white hover:bg-red-600'
                }`}
              >
                <FontAwesomeIcon 
                  icon={faArrowsRotate} 
                  className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} 
                />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              
              <Link href="/">
                <button className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all">
                  <FontAwesomeIcon icon={faHome} className="h-4 w-4" />
                  <span>Back to Chat</span>
                </button>
              </Link>
            </div>
          </div>
          
          {lastUpdated && (
            <div className="mt-4 flex items-center space-x-2 text-sm text-gray-500">
              <FontAwesomeIcon icon={faClock} className="h-4 w-4" />
              <span>Last updated: {lastUpdated}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-16">
            <FontAwesomeIcon icon={faTrophy} className="h-24 w-24 text-gray-300 mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Teams Yet</h2>
            <p className="text-gray-600">Teams will appear here once scoring begins</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Top 3 Podium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {leaderboard.slice(0, 3).map((team, index) => (
                <div
                  key={team.id}
                  className={`${getRankStyle(index)} rounded-xl p-6 text-center transition-all duration-300 hover:shadow-xl`}
                >
                  <div className="mb-4">
                    {getRankIcon(index)}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{team.team_name}</h3>
                  <div className="text-3xl font-bold mb-3">{team.score} pts</div>
                  <div className="text-sm opacity-90 mb-3">
                    {Array.isArray(team.members) ? team.members.join(', ') : team.members}
                  </div>
                  {team.project_name && (
                    <div className="text-sm opacity-75">
                      <FontAwesomeIcon icon={faDiagramProject} className="mr-1" />
                      {team.project_name}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Rest of the Teams */}
            {leaderboard.length > 3 && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FontAwesomeIcon icon={faChartLine} className="mr-2 text-brand-red" />
                    Full Rankings
                  </h2>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {leaderboard.slice(3).map((team, index) => (
                    <div key={team.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
                            <span className="text-xl font-bold text-gray-600">#{index + 4}</span>
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{team.team_name}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span className="flex items-center">
                                <FontAwesomeIcon icon={faUsers} className="mr-1" />
                                {Array.isArray(team.members) ? team.members.length : 1} members
                              </span>
                              {team.project_name && (
                                <span className="flex items-center">
                                  <FontAwesomeIcon icon={faDiagramProject} className="mr-1" />
                                  {team.project_name}
                                </span>
                              )}
                              {team.github_repo && (
                                <a 
                                  href={team.github_repo} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center text-blue-600 hover:text-blue-800"
                                >
                                  <FontAwesomeIcon icon={faCodeBranch} className="mr-1" />
                                  GitHub
                                </a>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {Array.isArray(team.members) ? team.members.join(', ') : team.members}
                            </div>
                            {team.project_description && (
                              <p className="text-sm text-gray-600 mt-2">{team.project_description}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold text-brand-red">{team.score}</div>
                          <div className="text-sm text-gray-500">points</div>
                          <div className="text-xs text-gray-400 mt-1">
                            Updated {new Date(team.updated_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
