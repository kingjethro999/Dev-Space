"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import {
  Mail,
  MessageSquare,
  BookOpen,
  Users2,
  ArrowLeft,
  Send,
  Github,
  Twitter,
  Linkedin,
  CheckCircle,
  Menu,
  X,
  Sun,
  Moon
} from "lucide-react"

export default function ContactPage() {
  const { theme, setTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    type: "general"
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 2000))
      setIsSubmitted(true)
    } catch (err) {
      setError("Failed to send message. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Success Message */}
          <div className="w-full max-w-md mx-auto space-y-8">
            <div className="text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-green-500" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Message Sent!</h1>
              <p className="text-muted-foreground mb-6 text-sm md:text-base">
                Thank you for reaching out. We'll get back to you within 24 hours.
              </p>
              <p className="text-xs md:text-sm text-muted-foreground mb-8">
                In the meantime, feel free to explore our community discussions or check out our documentation.
              </p>

              <div className="space-y-4">
                <Button
                  onClick={() => setIsSubmitted(false)}
                  variant="outline"
                  className="w-full"
                >
                  Send Another Message
                </Button>
                <Link href="/">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Illustration */}
          <div className="hidden lg:block">
            <Image
              src="/illustrations/Contact-us.png"
              alt="Contact Success"
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
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/dev-space-icon-transparent.png"
                alt="DevSpace"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-lg md:text-xl font-bold text-foreground">DevSpace</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Home
              </Link>
              <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Documentation
              </Link>
              <Link href="/auth/signup?redirect=/discussions" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Community
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-9 h-9 p-0"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border py-4 space-y-4">
              <div className="flex flex-col space-y-3">
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors px-2 py-2" onClick={() => setMobileMenuOpen(false)}>
                  Home
                </Link>
                <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors px-2 py-2" onClick={() => setMobileMenuOpen(false)}>
                  Documentation
                </Link>
                <Link href="/auth/signup?redirect=/discussions" className="text-muted-foreground hover:text-foreground transition-colors px-2 py-2" onClick={() => setMobileMenuOpen(false)}>
                  Community
                </Link>
              </div>
              <div className="border-t border-border pt-4 flex flex-col space-y-3">
                <div className="flex items-center justify-between px-2">
                  <span className="text-sm text-muted-foreground">Theme</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="w-9 h-9 p-0"
                  >
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  </Button>
                </div>
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">Sign In</Button>
                </Link>
                <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Get Started</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 pt-20 md:pt-24 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start">
          {/* Left Column - Contact Form */}
          <div className="space-y-6 md:space-y-8">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-3 md:mb-4">Get in Touch</h1>
              <p className="text-base md:text-xl text-muted-foreground mb-6 md:mb-8">
                Have a question, suggestion, or need help? We'd love to hear from you.
                Our team is here to help you succeed on DevSpace.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <Input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="What's this about?"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="general">General Question</option>
                  <option value="technical">Technical Support</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="partnership">Partnership</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <Textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Tell us more about your question or suggestion..."
                  rows={6}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Right Column - Contact Info & Illustration */}
          <div className="space-y-8">
            <div className="hidden lg:block">
              <Image
                src="/illustrations/Contact-us.png"
                alt="Contact Us"
                width={600}
                height={400}
                className="rounded-2xl shadow-2xl"
              />
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-foreground">Other Ways to Connect</h3>

              <div className="space-y-4">
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-foreground mb-2">Community Discussions</h4>
                      <p className="text-muted-foreground mb-3">
                        Join our active community discussions for quick help and peer support.
                      </p>
                      <Link href="/discussions">
                        <Button variant="outline" size="sm">
                          Join Discussion
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-foreground mb-2">Documentation</h4>
                      <p className="text-muted-foreground mb-3">
                        Check our comprehensive guides and tutorials for self-service help.
                      </p>
                      <Link href="/docs">
                        <Button variant="outline" size="sm">
                          Read Docs
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users2 className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-foreground mb-2">Developer Community</h4>
                      <p className="text-muted-foreground mb-3">
                        Connect with other developers and share your projects.
                      </p>
                      <Link href="/discover">
                        <Button variant="outline" size="sm">
                          Explore Community
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-foreground mb-2">Email Support</h4>
                      <p className="text-muted-foreground mb-3">
                        Send us an email directly for any inquiries or support requests.
                      </p>
                      <a href="mailto:this.is.dev.space@gmail.com">
                        <Button variant="outline" size="sm">
                          <Mail className="w-4 h-4 mr-2" />
                          this.is.dev.space@gmail.com
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-foreground mb-4">Follow Us</h4>
                <div className="flex space-x-4">
                  <a
                    href="https://github.com/kingjethro999"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-card border border-border rounded-lg flex items-center justify-center hover:bg-primary/10 transition-colors"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-card border border-border rounded-lg flex items-center justify-center hover:bg-primary/10 transition-colors"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-card border border-border rounded-lg flex items-center justify-center hover:bg-primary/10 transition-colors"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Built with ❤️ by <span className="text-primary font-semibold">King Jethro</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
