"use client"

import type React from "react"

import { useState } from "react"
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { doc, setDoc } from "firebase/firestore"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import Image from "next/image"

export default function SignupPage() {
  const { signInWithGitHub } = useAuth()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const createUserProfile = async (userId: string, displayName: string, userEmail: string) => {
    await setDoc(doc(db, "users", userId), {
      username: displayName,
      email: userEmail,
      bio: "",
      skills: [],
      avatar_url: "",
      social_links: {},
      created_at: new Date(),
      updated_at: new Date(),
      last_active: new Date(),
    })
  }

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(userCredential.user, { displayName: username })
      await createUserProfile(userCredential.user.uid, username, email)
      router.push("/profile/setup")
    } catch (err: any) {
      setError(err.message || "Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setError("")
    setLoading(true)

    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const displayName = result.user.displayName || "Developer"
      await createUserProfile(result.user.uid, displayName, result.user.email || "")
      router.push("/profile/setup")
    } catch (err: any) {
      setError(err.message || "Failed to sign up with Google")
    } finally {
      setLoading(false)
    }
  }

  const handleGithubSignup = async () => {
    setError("")
    setLoading(true)

    try {
      const result = await signInWithGitHub()
      const displayName = result.displayName || "Developer"
      await createUserProfile(result.uid, displayName, result.email || "")
      router.push("/profile/setup")
    } catch (err: any) {
      setError(err.message || "Failed to sign up with GitHub")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Column - Illustration */}
        <div className="hidden lg:block">
          <Image
            src="/illustrations/Authentication1.png"
            alt="Signup Illustration"
            width={600}
            height={500}
            className="rounded-2xl shadow-2xl"
            priority
          />
        </div>

        {/* Right Column - Signup Form */}
        <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Join Dev Space</h1>
          <p className="text-muted-foreground">Create your account and start connecting</p>
          <p className="text-xs text-muted-foreground mt-2">Built by <span className="text-blue-400 font-semibold">King Jethro</span> - <a href="https://github.com/kingjethro999" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">@kingjethro999</a></p>
        </div>

        <form onSubmit={handleEmailSignup} className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Confirm Password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-background text-muted-foreground">Or sign up with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button type="button" variant="outline" onClick={handleGoogleSignup} disabled={loading}>
            Google
          </Button>
          <Button type="button" variant="outline" onClick={handleGithubSignup} disabled={loading}>
            GitHub
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
        </div>
      </div>
    </div>
  )
}
