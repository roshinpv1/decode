/**
 * LLM Providers API - Get available providers and test them
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAvailableProviders, isProviderAvailable, createConfigForProvider } from '../../../../lib/llm-factory'
import { LLMClient } from '../../../../lib/llm-client'
import { LLMProvider } from '../../../../lib/llm-types'

export async function GET() {
  try {
    const availableProviders = getAvailableProviders()
    
    const providersInfo = availableProviders.map(provider => {
      const config = createConfigForProvider(provider)
      return {
        provider,
        model: config.model,
        available: true,
        baseUrl: config.baseUrl
      }
    })

    return NextResponse.json({
      availableProviders: providersInfo,
      count: availableProviders.length
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get provider information' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { provider, testPrompt = "Hello, respond with 'Test successful!'" } = await request.json()

    if (!provider || !Object.values(LLMProvider).includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider specified' },
        { status: 400 }
      )
    }

    // Check if provider is available
    if (!isProviderAvailable(provider)) {
      return NextResponse.json(
        { error: `Provider ${provider} is not available or configured` },
        { status: 400 }
      )
    }

    // Test the provider
    const config = createConfigForProvider(provider)
    const client = new LLMClient(config)

    const startTime = Date.now()
    const response = await client.callLLM(testPrompt, { timeout: 30000 })
    const endTime = Date.now()

    return NextResponse.json({
      provider,
      model: config.model,
      testSuccessful: true,
      response: response.substring(0, 200) + (response.length > 200 ? '...' : ''),
      responseTime: endTime - startTime,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Provider test failed',
        details: errorMessage,
        testSuccessful: false
      },
      { status: 500 }
    )
  }
}
