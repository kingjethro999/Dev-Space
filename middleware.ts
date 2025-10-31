import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes that require authentication
const protectedRoutes = [
  '/discover',
  '/projects',
  '/discussions',
  '/messages',
  '/profile',
  '/admin',
  '/discover',
]

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/docs',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  )

  // If it's a protected route, we'll let the client-side auth context handle the redirect
  // This middleware is mainly for server-side protection if needed
  if (isProtectedRoute) {
    // The client-side AuthProvider will handle redirecting unauthenticated users
    return NextResponse.next()
  }

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // For any other routes, allow them (they might be API routes, static files, etc.)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
