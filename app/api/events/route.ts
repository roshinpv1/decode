import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '../../../lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'active' // 'active' or 'recent'
    const limit = parseInt(searchParams.get('limit') || '10')
    const hours = parseInt(searchParams.get('hours') || '24')
    
    const db = getDatabase()
    let events
    
    if (type === 'recent') {
      events = db.getRecentEvents(hours, limit)
    } else {
      events = db.getActiveEvents(limit)
    }
    
    // Format events for frontend
    const formattedEvents = events.map(event => ({
      ...event,
      timeAgo: getTimeAgo(new Date(event.created_at)),
      isUpcoming: event.start_time && new Date(event.start_time) > new Date(),
      isOngoing: event.start_time && event.end_time && 
                 new Date(event.start_time) <= new Date() && 
                 new Date(event.end_time) >= new Date()
    }))
    
    console.log(`📢 EVENTS FETCHED: ${events.length} ${type} events`)
    
    return NextResponse.json({ 
      events: formattedEvents,
      type,
      lastUpdated: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Events API error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch events',
      events: []
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      action, 
      title, 
      description, 
      eventType = 'info',
      priority = 'medium',
      startTime,
      endTime,
      createdBy = 'admin',
      eventId
    } = await request.json()
    
    const db = getDatabase()
    
    if (action === 'create') {
      if (!title || !description) {
        return NextResponse.json({ error: 'Title and description required' }, { status: 400 })
      }
      
      const eventId = db.createEvent(
        title,
        description,
        eventType,
        priority,
        startTime,
        endTime,
        createdBy
      )
      
      console.log(`📢 EVENT CREATED: "${title}" (ID: ${eventId}) - Priority: ${priority}`)
      
      return NextResponse.json({ 
        success: true, 
        eventId,
        message: `Event "${title}" created successfully!`
      })
    }
    
    if (action === 'deactivate') {
      if (!eventId) {
        return NextResponse.json({ error: 'Event ID required' }, { status: 400 })
      }
      
      db.deactivateEvent(eventId)
      
      console.log(`🚫 EVENT DEACTIVATED: ID ${eventId}`)
      
      return NextResponse.json({ 
        success: true,
        message: 'Event deactivated successfully!'
      })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    
  } catch (error) {
    console.error('Events POST error:', error)
    return NextResponse.json({ 
      error: 'Failed to process request'
    }, { status: 500 })
  }
}

// Helper function to calculate time ago
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return date.toLocaleDateString()
}
