"use client"

import { initializeAnalytics as firebaseInitializeAnalytics, isSupported, Analytics } from "firebase/analytics"
import app from "./firebase"

let analytics: Analytics | null = null

export const initializeAnalytics = async (): Promise<Analytics | null> => {
  if (typeof window === 'undefined') return null
  
  try {
    const supported = await isSupported()
    if (supported && !analytics) {
      const host = window.location.hostname
      const cookieDomain = host === 'localhost' ? 'localhost' : (process.env.NEXT_PUBLIC_APP_DOMAIN || 'the-dev-space.vercel.app')
      analytics = firebaseInitializeAnalytics(app, {
        config: {
          cookie_domain: cookieDomain,
          cookie_flags: 'SameSite=None;Secure'
        }
      })
      console.log('Firebase Analytics initialized successfully')
    }
    return analytics
  } catch (error) {
    console.error('Failed to initialize Firebase Analytics:', error)
    return null
  }
}

export const getAnalyticsInstance = (): Analytics | null => {
  return analytics
}

export const logEvent = async (eventName: string, parameters?: any) => {
  if (typeof window === 'undefined') return
  
  try {
    const { logEvent: firebaseLogEvent } = await import('firebase/analytics')
    const analyticsInstance = getAnalyticsInstance()
    
    if (analyticsInstance) {
      firebaseLogEvent(analyticsInstance, eventName, parameters)
    }
  } catch (error) {
    console.error('Failed to log event:', error)
  }
}

export const logPageView = async (pageName: string) => {
  await logEvent('page_view', {
    page_title: pageName,
    page_location: window.location.href
  })
}

export const logUserAction = async (action: string, category: string, label?: string) => {
  await logEvent('user_action', {
    action,
    category,
    label
  })
}
