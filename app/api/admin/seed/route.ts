import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '../../../../lib/database'

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    const db = getDatabase()
    
    if (action === 'seed_demo_data') {
      // Create sample teams
      const teams = [
        { name: 'Code Crushers', members: ['Alice Johnson', 'Bob Smith', 'Charlie Brown'], project: 'AI Health Monitor', score: 850 },
        { name: 'Tech Titans', members: ['Diana Prince', 'Eve Adams', 'Frank Miller'], project: 'Smart City Dashboard', score: 720 },
        { name: 'Hack Heroes', members: ['Grace Lee', 'Henry Ford', 'Ivy Chen'], project: 'EcoTrack App', score: 680 },
        { name: 'Innovation Inc', members: ['Jack Wilson', 'Kate Davis'], project: 'EdTech Platform', score: 650 },
        { name: 'Digital Dynamos', members: ['Liam Taylor', 'Mia Garcia', 'Noah White', 'Olivia Black'], project: 'Fintech Solution', score: 590 },
        { name: 'Future Force', members: ['Paul Green', 'Quinn Blue'], project: 'IoT Farm System', score: 520 },
        { name: 'Byte Builders', members: ['Ryan Red', 'Sara Silver'], project: 'Social Impact App', score: 480 },
        { name: 'Logic Legends', members: ['Tom Gold'], project: 'Blockchain Voting', score: 420 }
      ]
      
      for (const team of teams) {
        try {
          const teamId = db.createTeam(
            team.name,
            JSON.stringify(team.members),
            team.project,
            `Innovative ${team.project} designed for maximum impact`
          )
          db.updateTeamScore(teamId, team.score)
        } catch (error) {
          console.log(`Team ${team.name} might already exist`)
        }
      }
      
      // Create sample events
      const events = [
        {
          title: '🚀 Hackathon Kickoff',
          description: 'Welcome to the hackathon! Team registration is now open. Check in at the main desk.',
          type: 'announcement',
          priority: 'high'
        },
        {
          title: '🍕 Lunch Break',
          description: 'Pizza and refreshments available in the main hall. Take a well-deserved break!',
          type: 'info',
          priority: 'medium'
        },
        {
          title: '⚠️ Submission Deadline Extended',
          description: 'Due to technical issues, submission deadline has been extended by 2 hours to 7:00 PM.',
          type: 'schedule_change',
          priority: 'urgent'
        },
        {
          title: '🏆 Final Presentations Start',
          description: 'Teams will present in alphabetical order. Each team gets 5 minutes + 2 minutes Q&A.',
          type: 'announcement',
          priority: 'high'
        },
        {
          title: '💡 Mentor Office Hours',
          description: 'Mentors available for one-on-one consultations in breakout rooms 1-3.',
          type: 'info',
          priority: 'medium'
        },
        {
          title: '⏰ 2 Hours Remaining',
          description: 'Only 2 hours left! Make sure to test your applications and prepare your presentations.',
          type: 'deadline',
          priority: 'high'
        }
      ]
      
      for (const event of events) {
        db.createEvent(
          event.title,
          event.description,
          event.type,
          event.priority,
          undefined,
          undefined,
          'admin'
        )
      }
      
      console.log('✅ DEMO DATA SEEDED: Teams and events created')
      
      return NextResponse.json({ 
        success: true,
        message: 'Demo data seeded successfully!',
        teamsCreated: teams.length,
        eventsCreated: events.length
      })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    
  } catch (error) {
    console.error('Seed data error:', error)
    return NextResponse.json({ 
      error: 'Failed to seed data'
    }, { status: 500 })
  }
}
