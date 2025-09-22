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
        return (
          <div className="relative">
            <FontAwesomeIcon icon={faCrown} className="h-8 w-8 text-yellow-600 drop-shadow-lg" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
          </div>
        )
      case 1:
        return <FontAwesomeIcon icon={faMedal} className="h-7 w-7 text-gray-600 drop-shadow-md" />
      case 2:
        return <FontAwesomeIcon icon={faAward} className="h-7 w-7 text-orange-600 drop-shadow-md" />
      default:
        return (
          <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-inner">
            <span className="text-lg font-bold text-gray-600">#{index + 1}</span>
          </div>
        )
    }
  }

  const getRankStyle = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-gradient-to-br from-yellow-100 via-yellow-200 to-amber-300 text-gray-800 shadow-xl border-2 border-yellow-200'
      case 1:
        return 'bg-gradient-to-br from-gray-100 via-gray-200 to-slate-300 text-gray-800 shadow-xl border-2 border-gray-200'
      case 2:
        return 'bg-gradient-to-br from-orange-100 via-orange-200 to-amber-300 text-gray-800 shadow-xl border-2 border-orange-200'
      default:
        return 'bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-lg transition-all duration-300'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-white to-gray-50">
      {/* Header */}
      <header className="relative bg-gradient-to-r from-brand-white via-gray-50 to-brand-white shadow-2xl border-b-4 border-brand-red overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-64 h-64 bg-brand-red rounded-full -translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-brand-yellow rounded-full translate-x-24 translate-y-24"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-brand-red to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <FontAwesomeIcon icon={faTrophy} className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-brand-yellow rounded-full flex items-center justify-center">
                  <FontAwesomeIcon icon={faCrown} className="h-3 w-3 text-red-600" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Hackathon Leaderboard
                </h1>
                <p className="text-lg text-gray-600 mt-1">Real-time team rankings and scores</p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Live Updates</span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <FontAwesomeIcon icon={faUsers} className="h-3 w-3" />
                    <span>{leaderboard.length} Teams</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchLeaderboard}
                disabled={refreshing}
                className={`group flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  refreshing 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-brand-red text-white hover:bg-red-600 hover:shadow-lg transform hover:scale-105'
                }`}
              >
                <FontAwesomeIcon 
                  icon={faArrowsRotate} 
                  className={`h-4 w-4 transition-transform duration-300 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} 
                />
                <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              
              <Link href="/">
                <button className="group flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 hover:shadow-lg transform hover:scale-105">
                  <FontAwesomeIcon icon={faHome} className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                  <span className="hidden sm:inline">Back to Chat</span>
                </button>
              </Link>
            </div>
          </div>
          
          {lastUpdated && (
            <div className="mt-6 flex items-center justify-center">
              <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FontAwesomeIcon icon={faClock} className="h-4 w-4 text-brand-red" />
                  <span>Last updated: {lastUpdated}</span>
                </div>
              </div>
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
          <div className="space-y-8">
            {/* Top 3 Podium */}
            <div className="relative">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">🏆 Top Performers</h2>
                <p className="text-gray-600">Celebrating our leading teams</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {leaderboard.slice(0, 3).map((team, index) => (
                  <div
                    key={team.id}
                    className={`${getRankStyle(index)} rounded-2xl p-8 text-center transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 relative overflow-hidden min-h-[320px] flex flex-col justify-center`}
                  >
                    {/* Decorative elements for top 3 */}
                    {index < 3 && (
                      <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full -translate-y-10 translate-x-10"></div>
                    )}
                    
                    <div className="relative z-10">
                      <div className="mb-6 flex justify-center">
                        {getRankIcon(index)}
                      </div>
                      
                      <h3 className="text-2xl font-bold mb-3 text-gray-900">{team.team_name}</h3>
                      
                      <div className="mb-4">
                        <div className="text-5xl font-black mb-1 text-gray-900">{team.score}</div>
                        <div className="text-sm font-bold tracking-wider text-gray-700">POINTS</div>
                      </div>
                      
                      <div className="text-sm text-gray-700 font-medium mb-4 line-clamp-2">
                        {Array.isArray(team.members) ? team.members.join(', ') : team.members}
                      </div>
                      
                      {team.project_name && (
                        <div className="bg-white/60 backdrop-blur-sm rounded-lg px-3 py-2 text-sm font-semibold text-gray-800 border border-white/50">
                          <FontAwesomeIcon icon={faDiagramProject} className="mr-2 text-gray-600" />
                          {team.project_name}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rest of the Teams */}
            {leaderboard.length > 3 && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <div className="w-8 h-8 bg-brand-red rounded-lg flex items-center justify-center mr-3">
                      <FontAwesomeIcon icon={faChartLine} className="h-4 w-4 text-white" />
                    </div>
                    Full Rankings
                  </h2>
                  <p className="text-gray-600 mt-1">Complete team standings</p>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {leaderboard.slice(3).map((team, index) => (
                    <div key={team.id} className="group p-6 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-300 hover:shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                          {getRankIcon(index + 3)}
                          
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-brand-red transition-colors">
                              {team.team_name}
                            </h3>
                            
                            <div className="flex items-center flex-wrap gap-4 mt-2 text-sm">
                              <span className="flex items-center bg-gray-100 px-2 py-1 rounded-full">
                                <FontAwesomeIcon icon={faUsers} className="mr-1 text-gray-500" />
                                <span className="font-medium">{Array.isArray(team.members) ? team.members.length : 1}</span>
                                <span className="text-gray-500 ml-1">members</span>
                              </span>
                              
                              {team.project_name && (
                                <span className="flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                                  <FontAwesomeIcon icon={faDiagramProject} className="mr-1" />
                                  <span className="font-medium">{team.project_name}</span>
                                </span>
                              )}
                              
                              {team.github_repo && (
                                <a 
                                  href={team.github_repo} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center bg-green-50 text-green-700 px-2 py-1 rounded-full hover:bg-green-100 transition-colors"
                                >
                                  <FontAwesomeIcon icon={faCodeBranch} className="mr-1" />
                                  <span className="font-medium">GitHub</span>
                                </a>
                              )}
                            </div>
                            
                            <div className="text-sm text-gray-600 mt-2 font-medium">
                              {Array.isArray(team.members) ? team.members.join(' • ') : team.members}
                            </div>
                            
                            {team.project_description && (
                              <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg border-l-2 border-brand-yellow">
                                {team.project_description}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right ml-6">
                          <div className="bg-gradient-to-br from-brand-red to-red-600 text-white px-4 py-3 rounded-xl shadow-lg">
                            <div className="text-3xl font-black">{team.score}</div>
                            <div className="text-xs font-semibold tracking-wide opacity-90">POINTS</div>
                          </div>
                          <div className="text-xs text-gray-400 mt-2 bg-gray-50 px-2 py-1 rounded-full">
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
