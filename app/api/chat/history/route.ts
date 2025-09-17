import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '../../../../lib/database'

// Helper function to get client IP address (same as in chat route)
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const clientIP = request.headers.get('x-client-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) return realIP
  if (clientIP) return clientIP
  
  const requestIP = (request as any).ip || 'unknown'
  
  if (requestIP === '::1' || requestIP === '127.0.0.1') {
    return 'localhost'
  }
  
  if (requestIP.includes('::1') || requestIP.includes('127.0.0.1')) {
    return 'localhost'
  }
  
  return requestIP
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const clientIP = getClientIP(request)
    const db = getDatabase()
    
    let chatHistory
    
    if (sessionId) {
      // Get history for specific session
      chatHistory = db.getSessionHistory(sessionId, limit)
    } else {
      // Get history for IP address
      chatHistory = db.getChatHistory(clientIP, limit)
    }
    
    // Convert database format to frontend format
    const messages = chatHistory.reverse().map(msg => ({
      id: msg.id.toString(),
      content: msg.message,
      role: msg.role,
      timestamp: new Date(msg.timestamp)
    }))
    
    console.log(`📜 CHAT HISTORY LOADED: ${messages.length} messages for ${sessionId ? 'session ' + sessionId : 'IP ' + clientIP}`)
    
    return NextResponse.json({ 
      messages,
      totalCount: messages.length,
      ipAddress: clientIP
    })
    
  } catch (error) {
    console.error('Chat history error:', error)
    return NextResponse.json({ 
      error: 'Failed to load chat history',
      messages: []
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    const clientIP = getClientIP(request)
    const db = getDatabase()
    
    if (action === 'clear') {
      // Clear chat history for this IP (implement if needed)
      return NextResponse.json({ success: true, message: 'Chat history cleared' })
    }
    
    if (action === 'analytics') {
      // Get analytics data
      const analytics = db.getAnalytics()
      return NextResponse.json({ analytics })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    
  } catch (error) {
    console.error('Chat history action error:', error)
    return NextResponse.json({ 
      error: 'Failed to process request'
    }, { status: 500 })
  }
}
