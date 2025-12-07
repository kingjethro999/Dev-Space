import { NextRequest, NextResponse } from 'next/server';
import { getOpenRouterApiKey } from '@/lib/secrets';

/**
 * API route for OpenRouter chat completions
 * This keeps the API key secure on the server-side
 * Supports text chat and image processing with google/gemma-3-27b-it:free
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get the API key from environment variables
    let apiKey: string;
    try {
      apiKey = getOpenRouterApiKey();
      if (!apiKey) {
        console.error('OpenRouter API key is missing');
        return NextResponse.json(
          { error: 'API key not configured. Please check environment variables.' },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Failed to get OpenRouter API key:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve API key. Make sure OPENROUTER_API_KEY is set in your .env file.' },
        { status: 500 }
      );
    }
    
    // Forward the request to OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://the-dev-space.vercel.app",
        "X-Title": "Dev Space",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      // Try to get error details from response
      let errorData: any = {};
      try {
        const text = await response.text();
        if (text) {
          errorData = JSON.parse(text);
        }
      } catch (e) {
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
      }

      console.error('OpenRouter API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        body: JSON.stringify(body, null, 2)
      });

      // Extract more detailed error message
      let errorMessage = `HTTP error! status: ${response.status}`;
      if (errorData.error) {
        if (typeof errorData.error === 'string') {
          errorMessage = errorData.error;
        } else if (errorData.error.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.error.type) {
          errorMessage = `${errorData.error.type}: ${errorData.error.message || 'Unknown error'}`;
        }
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }

      return NextResponse.json(
        { 
          error: errorMessage,
          message: errorMessage, // Add message field for compatibility
          details: errorData.error || errorData,
          status: response.status
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}

