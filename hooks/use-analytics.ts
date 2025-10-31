"use client"

import { useEffect } from "react"
import { initializeAnalytics } from "@/lib/analytics"

export function useAnalytics() {
  useEffect(() => {
    // Check if user has consented to analytics
    const consent = localStorage.getItem('devspace-cookie-consent')
    if (consent) {
      try {
        const preferences = JSON.parse(consent)
        if (preferences.analytics) {
          initializeAnalytics()
        }
      } catch (error) {
        console.error('Failed to parse cookie consent:', error)
      }
    }
  }, [])
}
