import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '../../../lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    
    const db = getDatabase()
    const leaderboard = db.getLeaderboard(limit)
    
    // Add rank to each team
    const rankedLeaderboard = leaderboard.map((team, index) => ({
      ...team,
      rank: index + 1,
      members: JSON.parse(team.members) // Parse members JSON string
    }))
    
    console.log(`📊 LEADERBOARD FETCHED: ${rankedLeaderboard.length} teams`)
    
    return NextResponse.json({ 
      leaderboard: rankedLeaderboard,
      lastUpdated: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch leaderboard',
      leaderboard: []
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, teamName, members, projectName, projectDescription, teamId, score } = await request.json()
    const db = getDatabase()
    
    if (action === 'create_team') {
      if (!teamName || !members) {
        return NextResponse.json({ error: 'Team name and members required' }, { status: 400 })
      }
      
      const teamId = db.createTeam(
        teamName, 
        JSON.stringify(members), 
        projectName, 
        projectDescription
      )
      
      console.log(`👥 TEAM CREATED: ${teamName} (ID: ${teamId})`)
      
      return NextResponse.json({ 
        success: true, 
        teamId,
        message: `Team "${teamName}" created successfully!`
      })
    }
    
    if (action === 'update_score') {
      if (!teamId || score === undefined) {
        return NextResponse.json({ error: 'Team ID and score required' }, { status: 400 })
      }
      
      db.updateTeamScore(teamId, score)
      
      console.log(`🏆 SCORE UPDATED: Team ${teamId} → ${score} points`)
      
      return NextResponse.json({ 
        success: true,
        message: `Team score updated to ${score} points!`
      })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    
  } catch (error) {
    console.error('Leaderboard POST error:', error)
    return NextResponse.json({ 
      error: 'Failed to process request'
    }, { status: 500 })
  }
}
