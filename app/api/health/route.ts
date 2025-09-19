import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test LM Studio connection
    const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://localhost:1234/v1/models'
    
    const response = await fetch(LM_STUDIO_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    const lmStudioStatus = response.ok ? 'connected' : 'disconnected'
    
    return NextResponse.json({ 
      status: 'healthy',
      lmStudio: lmStudioStatus,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ 
      status: 'healthy',
      lmStudio: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}
