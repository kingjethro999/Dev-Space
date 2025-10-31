"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { type User, onAuthStateChanged, signOut } from "firebase/auth"
import { auth } from "./firebase"
import { sendWelcomeEmail } from "./mail-utils"
import { signInWithGitHub } from "./github-utils"

interface AuthContextType {
  user: User | null
  loading: boolean
  logout: () => Promise<void>
  signInWithGitHub: () => Promise<User>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasSentWelcomeEmail, setHasSentWelcomeEmail] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      setLoading(false)
      
      // Send welcome email to users (new or returning)
      if (currentUser && !hasSentWelcomeEmail && currentUser.email) {
        try {
          const firstName = currentUser.displayName?.split(' ')[0] || 'Developer'
          
          // Check if this is a returning user (last login was more than 30 days ago)
          const lastLoginTime = currentUser.metadata.lastSignInTime
          const isReturningUser = lastLoginTime ? 
            (Date.now() - new Date(lastLoginTime).getTime()) > (30 * 24 * 60 * 60 * 1000) : 
            false
          
          await sendWelcomeEmail({
            username: currentUser.email,
            firstName,
            isReturningUser
          })
          setHasSentWelcomeEmail(true)
          console.log(`${isReturningUser ? 'Welcome back' : 'Welcome'} email sent to:`, currentUser.email)
        } catch (error) {
          console.error('Error sending welcome email:', error)
        }
      }
    })

    return () => unsubscribe()
  }, [hasSentWelcomeEmail])

  const logout = async () => {
    try {
      await signOut(auth)
      setHasSentWelcomeEmail(false) // Reset for next login
      // Redirect to home page after logout
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return <AuthContext.Provider value={{ user, loading, logout, signInWithGitHub }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
