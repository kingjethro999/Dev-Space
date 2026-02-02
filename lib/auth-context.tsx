"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { type User, onAuthStateChanged, signOut } from "firebase/auth"
import { auth, db } from "./firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      setLoading(false)

      // Only send welcome emails under specific conditions
      if (currentUser && currentUser.email) {
        try {
          // Check user document in Firestore for last email timestamp
          const userDocRef = doc(db, "users", currentUser.uid)
          const userDoc = await getDoc(userDocRef)
          const userData = userDoc.exists() ? userDoc.data() : null

          const now = Date.now()
          const TWENTY_ONE_DAYS_MS = 21 * 24 * 60 * 60 * 1000 // 21 days in milliseconds

          // Check if this is a brand new user (creation time equals last sign in time)
          const isFirstLogin = currentUser.metadata.creationTime === currentUser.metadata.lastSignInTime

          // Get last email timestamp from Firestore
          const lastEmailTime = userData?.last_welcome_email_at?.toMillis?.() || userData?.last_welcome_email_at || null

          // Determine if we should send an email
          let shouldSendEmail = false
          let isReturningUser = false

          if (isFirstLogin && !lastEmailTime) {
            // New user - send welcome email
            shouldSendEmail = true
            isReturningUser = false
          } else if (lastEmailTime) {
            // Existing user - only send "welcome back" if 21+ days since last email
            const timeSinceLastEmail = now - lastEmailTime
            if (timeSinceLastEmail > TWENTY_ONE_DAYS_MS) {
              shouldSendEmail = true
              isReturningUser = true
            }
          }

          if (shouldSendEmail && userDoc.exists()) {
            const firstName = currentUser.displayName?.split(' ')[0] || 'Developer'
            await sendWelcomeEmail({
              username: currentUser.email,
              firstName,
              isReturningUser
            })
            // Update Firestore with the timestamp
            await updateDoc(userDocRef, {
              last_welcome_email_at: now
            })
            console.log(`${isReturningUser ? 'Welcome back' : 'Welcome'} email sent to:`, currentUser.email)
          }
        } catch (error) {
          console.error('Error sending welcome email:', error)
        }
      }
    })

    return () => unsubscribe()
  }, [])

  const logout = async () => {
    try {
      await signOut(auth)
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
