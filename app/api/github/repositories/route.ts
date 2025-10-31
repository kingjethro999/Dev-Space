import { NextRequest, NextResponse } from 'next/server'
import { getUserRepositories } from '@/lib/github-utils'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = authHeader.split(' ')[1]
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    // Fetch repositories from GitHub using Firebase auth
    const repositories = await getUserRepositories(userId)

    return NextResponse.json({ repositories })
  } catch (error: any) {
    console.error('Error fetching repositories:', error)
    
    // Provide more specific error messages
    if (error.message === 'GitHub not connected') {
      return NextResponse.json(
        { error: 'GitHub not connected. Please connect your GitHub account first.' },
        { status: 401 }
      )
    }
    
    if (error.message?.includes('GitHub API error')) {
      return NextResponse.json(
        { error: 'Failed to fetch repositories from GitHub. Please check your GitHub connection.' },
        { status: error.message.includes('401') || error.message.includes('403') ? 401 : 500 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch repositories' },
      { status: 500 }
    )
  }
}
