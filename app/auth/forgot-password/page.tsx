"use client"

import type React from "react"
import { useState } from "react"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Mail, CheckCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await sendPasswordResetEmail(auth, email)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "Failed to send reset email")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Success Message */}
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Check Your Email</h1>
              <p className="text-sm md:text-base text-muted-foreground mb-6">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="text-sm text-muted-foreground mb-8">
                Click the link in the email to reset your password. If you don't see it, check your spam folder.
              </p>

              <div className="space-y-4">
                <Button
                  onClick={() => setSuccess(false)}
                  variant="outline"
                  className="w-full"
                >
                  Try Another Email
                </Button>
                <Link href="/auth/login">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Illustration */}
          <div className="hidden lg:block">
            <Image
              src="/illustrations/Forgot-password.png"
              alt="Password Reset Success"
              width={600}
              height={500}
              className="rounded-2xl shadow-2xl"
              priority
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Column - Illustration */}
        <div className="hidden lg:block">
          <Image
            src="/illustrations/Forgot-password.png"
            alt="Forgot Password Illustration"
            width={600}
            height={500}
            className="rounded-2xl shadow-2xl"
            priority
          />
        </div>

        {/* Right Column - Reset Form */}
        <div className="w-full max-w-md lg:max-w-lg mx-auto space-y-6 md:space-y-8">
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Forgot Password?</h1>
            <p className="text-sm md:text-base text-muted-foreground mb-6">
              No worries! Enter your email address and we'll send you a link to reset your password.
            </p>
            <p className="text-xs text-muted-foreground">Built by <span className="text-blue-400 font-semibold">King Jethro</span></p>
          </div>

          <form onSubmit={handlePasswordReset} className="space-y-6">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>

          <div className="text-center space-y-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </Link>

            <p className="text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
