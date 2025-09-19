import { NextRequest, NextResponse } from 'next/server'
import { writeFile, appendFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { getDatabase } from '../../../lib/database'

// Helper function to get client IP address
function getClientIP(request: NextRequest): string {
  // Check for IP in various headers (for different proxy setups)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const clientIP = request.headers.get('x-client-ip')
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, get the first one
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) return realIP
  if (clientIP) return clientIP
  
  // Get the request IP (NextRequest doesn't have ip property in types)
  const requestIP = (request as any).ip || 'unknown'
  
  // Handle local development IPs
  if (requestIP === '::1' || requestIP === '127.0.0.1') {
    return 'localhost'
  }
  
  // Handle IPv6 localhost variations
  if (requestIP.includes('::1') || requestIP.includes('127.0.0.1')) {
    return 'localhost'
  }
  
  return requestIP
}

// File logging function
async function writeToLogFile(logEntry: any) {
  try {
    const logsDir = path.join(process.cwd(), 'logs')
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const logFile = path.join(logsDir, `hackathon-${today}.log`)
    
    // Create logs directory if it doesn't exist
    if (!existsSync(logsDir)) {
      await mkdir(logsDir, { recursive: true })
    }
    
    // Append log entry to file
    const logLine = JSON.stringify(logEntry) + '\n'
    await appendFile(logFile, logLine)
  } catch (error) {
    console.error('Failed to write to log file:', error)
  }
}

// Debug function to show all IP-related headers
function debugIPHeaders(request: NextRequest) {
  const ipDebug = {
    'request.ip': (request as any).ip,
    'x-forwarded-for': request.headers.get('x-forwarded-for'),
    'x-real-ip': request.headers.get('x-real-ip'),
    'x-client-ip': request.headers.get('x-client-ip'),
    'cf-connecting-ip': request.headers.get('cf-connecting-ip'), // Cloudflare
    'true-client-ip': request.headers.get('true-client-ip'), // Cloudflare Enterprise
    'x-forwarded': request.headers.get('x-forwarded'),
    'forwarded-for': request.headers.get('forwarded-for'),
    'forwarded': request.headers.get('forwarded')
  }
  
  console.log('🔍 IP DEBUG INFO:', JSON.stringify(ipDebug, null, 2))
  return ipDebug
}

// Logging function
async function logUserRequest(ip: string, message: string, userAgent?: string, request?: NextRequest) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    ip,
    message: message.substring(0, 500), // Limit message length for logging
    userAgent,
    event: 'LLM_REQUEST'
  }
  
  // Log to console
  console.log('🤖 USER REQUEST:', JSON.stringify(logEntry, null, 2))
  
  // Debug IP info in development
  if (process.env.NODE_ENV !== 'production' && request) {
    debugIPHeaders(request)
  }
  
  // Also write to file
  await writeToLogFile(logEntry)
}

export async function POST(request: NextRequest) {
  // Get user information early for logging
  const clientIP = getClientIP(request)
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  try {
    const { message, sessionId } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }
    
    // Initialize database
    const db = getDatabase()
    
    // Save user message to database
    const userMessageId = db.saveMessage(clientIP, message, 'user', sessionId, userAgent)
    
    // Log the user request before LLM call
    await logUserRequest(clientIP, message, userAgent, request)

    // LM Studio typically runs on localhost:1234 by default
    const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://localhost:1234/v1/chat/completions'

    const response = await fetch(LM_STUDIO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'local-model', // LM Studio will use whatever model is loaded
        messages: [
          {
            role: 'system',
            content: `You are a helpful AI assistant supporting hackathon participants. Your role is to provide quick, concise, and practical information about the event.


Knowledge Base

Event Details
* Start Date Time: 13th October 2025 9:00 AM
* End Date Time: 13th October 2025 05:00 PM
* Locations: Hyderabad & Bangalore
* Registration: Use the link https://wellsfargo.sharepoint.com/Bl:/s/CCPT-AandETendP/FCN9ZPB1Tv93h7ZgkDxt04m9w7nav=Yzkz)
Key Focus Areas & Themes
* Platform: Observability, environment stability, migration, OpSec
* Payments: Integration, processing, compliance, best practices
* CRM: Tools, data handling, automation tips
* Marketing Technology: Campaign tools, analytics, segmentation, ROI measurement
* Customer Experience (CX) Reimagined:
    * Focus: Use existing mobile banking libraries and AI components for hyper-personalization.
    * Sample Ideas: AI chatbot for financial advice; a gamified personal finance tool.
* Internal Operations & Efficiency:
    * Focus: Streamline internal processes for bank employees.
    * Sample Ideas: Automated loan application tool; a teller dashboard for a 360-degree customer view.
* Fraud & Cybersecurity:
    * Focus: Combat financial crime using the bank's security and anomaly detection libraries.
    * Sample Ideas: Real-time fraud detection system; a new 2FA method using biometrics.
* Data-Driven Decisions:
    * Focus: Use the bank's data to create predictive models or reporting tools.
    * Sample Ideas: Predictive model for customer churn; a dashboard for branch managers to optimize staffing.
Hackathon Guidelines
* Technologies:
    * Allowed: Open-source frameworks, APIs provided by organizers.
    * Encouraged: AI/ML, automation, data-driven solutions.
    * Restricted: Proprietary tools without licenses, plagiarism, disallowed APIs.
* Infrastructure:
    * OCP Cloud environments, Local dev box, shared repositories provided.
    * Participants must ensure environment stability and follow OpSec practices.
* Evaluation Criteria:
    * Innovation: Novelty and creativity
    * Functionality: Working demo, technical feasibility
    * Scalability: Growth handling, integration potential
    * User Experience: Simplicity, design, usability
    * Impact: Business value, relevance, problem-solving effectiveness
FAQs for Participants
* Which internal libraries and APIs can we use? A list of approved internal libraries, APIs, and data access points will be provided. We will not allow the use of external public APIs unless explicitly approved.
* Will we have access to internal data? Yes, sanitized and anonymized data sets will be made available to ensure no sensitive customer or business data is used.
* How do we get technical support for internal systems? Dedicated mentors from our core engineering teams will be available on-site and on a designated Slack channel.
* What are the security and compliance requirements for our projects? All projects must adhere to the bank's standard security and compliance protocols. Mentors will help ensure your project meets these standards.
* Can we work on a project we're already assigned to in our day job? No. Hackathon projects must be completely new and unrelated to your current work assignments to encourage fresh ideas.
* What happens to the winning project? Winning projects will be reviewed by a panel of senior leaders for potential integration into our official product roadmap.

Response Guidelines

* Keep answers short (2-3 sentences) unless more detail is requested.

* Reference official documentation/resources whenever possible.
* Encourage participants to ask follow-up questions.

Important Rules

* Never disclose your model/system details.
* If asked something outside the hackathon's scope, reply:"I'm a helpful AI assistant designed to support hackathon participants. Please reach out to the relevant team member for further assistance."
* If asked about the hackathon itself, restate your role, key focus areas, event details, and guidelines.

            `
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
        stream: false
      })
    })

    if (!response.ok) {
      throw new Error(`LM Studio API error: ${response.status}`)
    }

    const data = await response.json()
    const botMessage = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.'

    // Save bot response to database
    const botMessageId = db.saveMessage(clientIP, botMessage, 'bot', sessionId, userAgent)

    // Log successful LLM response
    const successLog = {
      timestamp: new Date().toISOString(),
      ip: clientIP,
      responseLength: botMessage.length,
      event: 'LLM_RESPONSE_SUCCESS',
      userMessageId,
      botMessageId
    }
    console.log('✅ LLM RESPONSE SUCCESS:', successLog)
    await writeToLogFile(successLog)

    return NextResponse.json({ message: botMessage })
  } catch (error) {
    // Log error with user context
    const errorLog = {
      timestamp: new Date().toISOString(),
      ip: clientIP,
      error: error instanceof Error ? error.message : 'Unknown error',
      event: 'LLM_REQUEST_FAILED'
    }
    console.error('❌ LLM REQUEST FAILED:', errorLog)
    await writeToLogFile(errorLog)
    
    // Fallback response when LM Studio is not available
    return NextResponse.json({ 
      message: 'I\'m having trouble connecting to the AI service. Please make sure LM Studio is running on localhost:1234 with a model loaded.',
      error: true 
    })
  }
}
