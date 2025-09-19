import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '../../../lib/database'

export async function GET() {
  try {
    const db = getDatabase()
    
    // Get all prompts from database or return default ones
    const prompts = db.getPrompts()
    
    return NextResponse.json({ prompts })
  } catch (error) {
    console.error('Failed to get prompts:', error)
    return NextResponse.json({ 
      error: 'Failed to get prompts',
      prompts: [] 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompts } = await request.json()
    
    if (!Array.isArray(prompts)) {
      return NextResponse.json({ 
        error: 'Prompts must be an array' 
      }, { status: 400 })
    }
    
    const db = getDatabase()
    
    // Save prompts to database
    db.savePrompts(prompts)
    
    return NextResponse.json({ 
      success: true,
      message: 'Prompts updated successfully' 
    })
  } catch (error) {
    console.error('Failed to save prompts:', error)
    return NextResponse.json({ 
      error: 'Failed to save prompts' 
    }, { status: 500 })
  }
}
