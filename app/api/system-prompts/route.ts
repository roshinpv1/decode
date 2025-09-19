import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '../../../lib/database'

export async function GET() {
  try {
    const db = getDatabase()
    
    // Get all system prompts from database
    const systemPrompts = db.getAllSystemPrompts()
    
    return NextResponse.json({ systemPrompts })
  } catch (error) {
    console.error('Failed to get system prompts:', error)
    return NextResponse.json({ 
      error: 'Failed to get system prompts',
      systemPrompts: [] 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, content } = await request.json()
    
    if (!name || !content) {
      return NextResponse.json({ 
        error: 'Name and content are required' 
      }, { status: 400 })
    }
    
    const db = getDatabase()
    
    // Save system prompt to database
    db.saveSystemPrompt(name, content)
    
    return NextResponse.json({ 
      success: true,
      message: 'System prompt updated successfully' 
    })
  } catch (error) {
    console.error('Failed to save system prompt:', error)
    return NextResponse.json({ 
      error: 'Failed to save system prompt' 
    }, { status: 500 })
  }
}

// Get specific system prompt
export async function GET_SPECIFIC(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name') || 'default'
    
    const db = getDatabase()
    const content = db.getSystemPrompt(name)
    
    return NextResponse.json({ 
      name,
      content 
    })
  } catch (error) {
    console.error('Failed to get specific system prompt:', error)
    return NextResponse.json({ 
      error: 'Failed to get system prompt',
      content: '' 
    }, { status: 500 })
  }
}
