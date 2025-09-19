import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '../../../lib/database'

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
    const clientIP = getClientIP(request)
    const db = getDatabase()
    
    const userProfile = db.getUserProfile(clientIP)
    
    console.log(`👤 PROFILE CHECK: IP ${clientIP} - ${userProfile ? 'Found' : 'Not found'}`)
    
    return NextResponse.json({ 
      profile: userProfile,
      ipAddress: clientIP,
      hasProfile: !!userProfile
    })
    
  } catch (error) {
    console.error('Profile GET error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch profile',
      hasProfile: false
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, userName, teamName, email, role } = await request.json()
    const clientIP = getClientIP(request)
    const db = getDatabase()
    
    if (action === 'create' || action === 'update') {
      if (!userName || !teamName) {
        return NextResponse.json({ 
          error: 'User name and team name are required' 
        }, { status: 400 })
      }
      
      const profileId = db.createUserProfile(clientIP, userName, teamName, email, role)
      
      console.log(`👤 PROFILE ${action.toUpperCase()}: ${userName} (${teamName}) for IP ${clientIP}`)
      
      return NextResponse.json({ 
        success: true,
        profileId,
        message: `Profile ${action === 'create' ? 'created' : 'updated'} successfully!`,
        profile: {
          user_name: userName,
          team_name: teamName,
          email,
          role,
          ip_address: clientIP
        }
      })
    }
    
    if (action === 'check') {
      const userProfile = db.getUserProfile(clientIP)
      
      return NextResponse.json({ 
        hasProfile: !!userProfile,
        profile: userProfile
      })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    
  } catch (error) {
    console.error('Profile POST error:', error)
    return NextResponse.json({ 
      error: 'Failed to process profile request'
    }, { status: 500 })
  }
}
