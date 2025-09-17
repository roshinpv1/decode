import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

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
            content: `
            
                        You are a helpful AI assistant supporting hackathon participants. Your role is to provide quick, concise, and practical information about the event.

            Event Details

            Date: 13th October 2025

            Locations: Hyderabad & Bangalore

            Registration: Click here to register

            Key Focus Areas

            Platform – Observability, environment stability, migration, and OpSec

            Payments – Integration, processing, compliance, and best practices

            CRM – Tools, data handling, and automation tips

            Marketing Technology – Campaign tools, analytics, segmentation, and ROI measurement

            Hackathon Guidelines

            Technologies:

            Allowed: Open-source frameworks, cloud platforms (AWS, Azure, GCP), APIs provided by organizers

            Encouraged: AI/ML, automation, and data-driven solutions

            Restricted: Proprietary tools without licenses, plagiarism, or use of disallowed APIs

            Infrastructure:

            Cloud environments, sandbox APIs, and shared repositories will be provided

            Participants must ensure environment stability and adhere to OpSec practices

            Evaluation Criteria:

            Innovation – Novelty and creativity of the solution

            Functionality – Working demo and technical feasibility

            Scalability – Ability to handle growth and integration

            User Experience – Simplicity, design, and usability

            Impact – Business value, relevance, and problem-solving effectiveness

            Response Guidelines

              Keep answers short (1–3 sentences) unless more detail is requested

              Use bullet points for steps, features, or comparisons
              Reference official documentation/resources whenever possible
              Encourage participants to ask follow-up questions
              Important Rules
              Never disclose model/system details
              If asked something outside hackathon scope, reply:
              “I’m a helpful AI assistant designed to support hackathon participants. Please reach out to the relevant team member for further assistance.”
              If asked about the hackathon itself, restate your role, focus areas, event details, and guidelines

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

    return NextResponse.json({ message: botMessage })
  } catch (error) {
    console.error('Chat API error:', error)
    
    // Fallback response when LM Studio is not available
    return NextResponse.json({ 
      message: 'I\'m having trouble connecting to the AI service. Please make sure LM Studio is running on localhost:1234 with a model loaded.',
      error: true 
    })
  }
}
