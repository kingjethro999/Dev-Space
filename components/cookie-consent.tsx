"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Cookie, Settings, CheckCircle, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  marketing: boolean
}

export function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true, can't be disabled
    analytics: false,
    marketing: false
  })

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('devspace-cookie-consent')
    if (!consent) {
      setShowConsent(true)
    } else {
      const savedPreferences = JSON.parse(consent)
      setPreferences(savedPreferences)
    }
  }, [])

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true
    }
    setPreferences(allAccepted)
    localStorage.setItem('devspace-cookie-consent', JSON.stringify(allAccepted))
    setShowConsent(false)
    setShowSettings(false)
    
    // Initialize analytics if accepted
    if (allAccepted.analytics) {
      initializeAnalytics()
    }
  }

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false
    }
    setPreferences(onlyNecessary)
    localStorage.setItem('devspace-cookie-consent', JSON.stringify(onlyNecessary))
    setShowConsent(false)
    setShowSettings(false)
  }

  const handleSavePreferences = () => {
    localStorage.setItem('devspace-cookie-consent', JSON.stringify(preferences))
    setShowConsent(false)
    setShowSettings(false)
    
    // Initialize analytics if accepted
    if (preferences.analytics) {
      initializeAnalytics()
    }
  }

  const initializeAnalytics = async () => {
    if (typeof window !== 'undefined') {
      try {
        const { initializeAnalytics } = await import('@/lib/analytics')
        await initializeAnalytics()
        console.log('Analytics initialized with user consent')
      } catch (error) {
        console.error('Failed to initialize analytics:', error)
      }
    }
  }

  const updatePreference = (key: keyof CookiePreferences, value: boolean) => {
    if (key === 'necessary') return // Can't disable necessary cookies
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  if (!showConsent) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto"
      >
        <Card className="bg-card border-border shadow-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <Cookie className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Cookie Preferences</CardTitle>
            </div>
            <CardDescription>
              We use cookies to enhance your experience and analyze our traffic.
            </CardDescription>
          </CardHeader>

          {!showSettings ? (
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                We use essential cookies to make our site work. We'd also like to set analytics cookies 
                to help us improve it by collecting and reporting information on how you use it.
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={handleAcceptAll} 
                  className="flex-1"
                  size="sm"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept All
                </Button>
                <Button 
                  onClick={handleRejectAll} 
                  variant="outline" 
                  className="flex-1"
                  size="sm"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject All
                </Button>
                <Button 
                  onClick={() => setShowSettings(true)} 
                  variant="ghost" 
                  size="sm"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          ) : (
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="necessary" className="text-sm font-medium">
                      Necessary Cookies
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Required for the website to function properly
                    </p>
                  </div>
                  <Switch
                    id="necessary"
                    checked={preferences.necessary}
                    disabled
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="analytics" className="text-sm font-medium">
                      Analytics Cookies
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Help us understand how visitors interact with our website
                    </p>
                  </div>
                  <Switch
                    id="analytics"
                    checked={preferences.analytics}
                    onCheckedChange={(checked) => updatePreference('analytics', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="marketing" className="text-sm font-medium">
                      Marketing Cookies
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Used to track visitors across websites for advertising
                    </p>
                  </div>
                  <Switch
                    id="marketing"
                    checked={preferences.marketing}
                    onCheckedChange={(checked) => updatePreference('marketing', checked)}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={handleSavePreferences} 
                  className="flex-1"
                  size="sm"
                >
                  Save Preferences
                </Button>
                <Button 
                  onClick={() => setShowSettings(false)} 
                  variant="outline" 
                  size="sm"
                >
                  Back
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
