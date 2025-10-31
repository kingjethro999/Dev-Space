"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"
import Image from "next/image"
import {
  Code2, Users, GitBranch, MessageSquare, ArrowRight, Sun, Moon,
  Star, Zap, Shield, Globe, Sparkles, Search, Menu, X,
  Github, ExternalLink, Play, ChevronRight, Bot, Send,
  Terminal, Database, Cloud, Lock, CheckCircle, Rocket, Settings,
  Building2, Network, Code, Laptop, Monitor, Smartphone,
  Briefcase, Target, Award, TrendingUp, Users2, GitCommit,
  BookOpen, Lightbulb, Cpu, HardDrive, Wifi, Globe2, HelpCircle
} from "lucide-react"
import { useTheme } from "next-themes"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useAnalytics } from "@/hooks/use-analytics"
import { GLOW_AI_SYSTEM_PROMPT } from "@/lib/glow-ai-config"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [aiChatOpen, setAiChatOpen] = useState(false)
  const [chatMessage, setChatMessage] = useState("")
  const [chatHistory, setChatHistory] = useState<Array<{ role: string, content: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 300], [0, -50])

  // Initialize analytics if user has consented
  useAnalytics()

  useEffect(() => {
    setMounted(true)
    // Check for chat parameter
    if (searchParams.get('chat') === 'open') {
      setAiChatOpen(true)
    }
  }, [searchParams])

  useEffect(() => {
    if (!loading && user) {
      router.push("/discover")
    }
  }, [user, loading, router])

  const handleAiChat = async (message: string) => {
    if (!message.trim()) return

    setIsLoading(true)
    setChatHistory(prev => [...prev, { role: 'user', content: message }])
    setChatMessage("")

    try {
      // Use our secure API route instead of calling OpenRouter directly
      const response = await fetch("/api/openrouter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "google/gemma-3-27b-it:free",
          "messages": [
            {
              "role": "system",
              "content": GLOW_AI_SYSTEM_PROMPT
            },
            ...chatHistory,
            { role: "user", content: message }
          ]
        })
      })

      if (!response.ok) {
        // Try to get error details
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = typeof errorData.error === 'string' 
              ? errorData.error 
              : errorData.error.message || errorMessage;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          errorMessage = `${response.status}: ${response.statusText || 'Unknown error'}`;
        }

        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment before trying again.')
        }
        throw new Error(errorMessage);
      }

      const data = await response.json()
      console.log('API Response:', data) // Debug log

      // Handle different response formats
      let assistantMessage = ''
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        assistantMessage = data.choices[0].message.content
      } else if (data.content) {
        assistantMessage = data.content
      } else if (data.message) {
        assistantMessage = data.message
      } else {
        assistantMessage = 'I received an unexpected response format. Please try again.'
      }

      setChatHistory(prev => [...prev, { role: 'assistant', content: assistantMessage }])
    } catch (error) {
      console.error('AI Chat error:', error)

      // Provide helpful fallback responses based on error type
      let errorMessage = 'Sorry, I encountered an error. Please try again.'

      if (error instanceof Error) {
        if (error.message.includes('Rate limit')) {
          errorMessage = 'I\'m getting too many requests right now. Please wait a moment and try again. In the meantime, feel free to explore DevSpace features!'
        } else if (error.message.includes('429')) {
          errorMessage = 'Rate limit exceeded. Please wait a moment before trying again. You can explore the DevSpace platform while you wait!'
        } else {
          errorMessage = `Sorry, I encountered an error: ${error.message}. Please try again later.`
        }
      }

      setChatHistory(prev => [...prev, { role: 'assistant', content: errorMessage }])
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-blue-600"></div>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-slate-300 mt-4 text-lg font-medium"
          >
            Initializing Dev Space...
          </motion.p>
        </div>
      </div>
    )
  }

  if (user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center space-x-3"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <Image
                  src="/dev-space-icon-transparent.png"
                  alt="DevSpace Platform"
                  width={600}
                  height={400}
                  className="rounded-2xl shadow-2xl"
                  priority
                />
              </div>
              <span className="text-xl font-bold text-foreground">
                DevSpace
              </span>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <div className="flex items-center space-x-6">
                <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
                  Documentation
                </Link>
                <Link href="/projects" className="text-muted-foreground hover:text-foreground transition-colors">
                  Projects
                </Link>
                <Link href="/discussions" className="text-muted-foreground hover:text-foreground transition-colors">
                  Community
                </Link>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </div>

              <div className="flex items-center space-x-4">
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
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>

            {/* Mobile Menu */}
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
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden bg-gradient-to-br from-background to-muted/20">
        <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground"
                >
                  Where Developers{" "}
                  <span className="text-primary">
                    Connect
                  </span>,{" "}
                  <span className="text-primary">
                    Collaborate
                  </span>, and{" "}
                  <span className="text-primary">
                    Grow
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-xl text-muted-foreground max-w-[1560px]"
                >
                  DevSpace is more than a platform — it's a movement. Built to bridge the gap between
                  student developers and the wider tech world, we help you share your projects, learn from others,
                  and build together — no matter your level, age, or background.
                </motion.p>
              </div>

              {/* Feature Highlights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="grid grid-cols-2 gap-4"
              >
                {[
                  { icon: MessageSquare, text: "Connect & Collaborate", color: "text-blue-500" },
                  { icon: Code2, text: "Share Projects", color: "text-green-500" },
                  { icon: BookOpen, text: "Learn & Grow", color: "text-purple-500" },
                  { icon: Globe2, text: "Showcase Journey", color: "text-orange-500" }
                ].map((feature, index) => (
                  <div
                    key={feature.text}
                    className="flex items-center space-x-3 p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <feature.icon className={`w-5 h-5 ${feature.color}`} />
                    <span className="text-sm font-medium text-foreground">{feature.text}</span>
                  </div>
                ))}
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link href="/auth/signup">
                  <Button size="lg" className="px-8 py-4 text-lg">
                    Join the Space
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/projects">
                  <Button size="lg" variant="outline" className="px-8 py-4 text-lg">
                    Explore Projects
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Right Column - DevSpace Visual */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className=""
            >
              <div className="justify-center items-center">
                <Image
                  src="/illustrations/Innovation-amico(1).png"
                  alt="DevSpace Platform"
                  width={600}
                  height={400}
                  className="rounded-2xl shadow-2xl"
                  priority
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              A Place for Every Developer —{" "}
              <span className="text-primary">
                From Classroom to Cosmos
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-[1560px] mx-auto">
              DevSpace started as an idea on campus — a way to connect talented but isolated developers.
              We saw brilliant coders who were too shy or too uncertain to collaborate because of age gaps,
              level differences, or simple distance.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* The Problem Section */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-8"
            >
              <div className="bg-card rounded-2xl p-8 border border-border">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                    <X className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-destructive">THE PROBLEM</h3>
                    <h4 className="text-xl font-semibold text-foreground">
                      Developers Are Everywhere — But Connection Is Missing
                    </h4>
                  </div>
                </div>
                <p className="text-muted-foreground text-lg mb-8">
                  On many campuses, great developers work in silence. They build projects alone,
                  rarely meeting others who could teach, learn, or build with them. Sometimes it's
                  because of level differences. Sometimes it's age. Sometimes it's just not knowing where to start.
                </p>

                <div className="space-y-4">
                  {[
                    { icon: Users, title: "Working in Silence", description: "Brilliant coders building alone", color: "text-red-500" },
                    { icon: BookOpen, title: "Level Barriers", description: "Age and experience gaps", color: "text-orange-500" },
                    { icon: HelpCircle, title: "No Starting Point", description: "Not knowing where to begin", color: "text-yellow-500" }
                  ].map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                      className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer group"
                    >
                      <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
                        <feature.icon className={`w-5 h-5 ${feature.color}`} />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-foreground">{feature.title}</h5>
                        <p className="text-muted-foreground text-sm">{feature.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* The Solution Section */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="space-y-8"
            >
              <div className="bg-card rounded-2xl p-8 border border-border">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-primary">THE SOLUTION</h3>
                    <h4 className="text-xl font-semibold text-foreground">
                      DevSpace Changes That — Building Together Is Better
                    </h4>
                  </div>
                </div>
                <p className="text-muted-foreground text-lg mb-8">
                  We make it easy for any developer — young or experienced — to find others,
                  form teams, and share their progress publicly. Collaboration should never depend
                  on class level. It should depend on curiosity, effort, and passion for code.
                </p>

                <div className="space-y-4">
                  {[
                    { icon: Users2, title: "Easy Connections", description: "Find developers who share your passion", color: "text-green-500" },
                    { icon: Rocket, title: "Project Showcase", description: "Share your journey from idea to launch", color: "text-blue-500" },
                    { icon: Lightbulb, title: "Passion-Based", description: "Collaboration based on curiosity, not level", color: "text-purple-500" }
                  ].map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                      className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer group"
                    >
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <feature.icon className={`w-5 h-5 ${feature.color}`} />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-foreground">{feature.title}</h5>
                        <p className="text-muted-foreground text-sm">{feature.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* DevSpace Features Section */}
      <section className="py-20 bg-background">
        <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Your Developer Journey,{" "}
              <span className="text-primary">
                All in One Space
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-[1560px] mx-auto">
              DevSpace is a community of developers helping each other become better.
              We don't just share finished products — we share journeys.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Code2,
                title: "Project Launchpad",
                description: "Share your projects, track your progress, and tell your story. Whether it's a hackathon idea or a major app, DevSpace gives it visibility and life.",
                color: "text-blue-500",
                bgColor: "bg-blue-500/10"
              },
              {
                icon: Users2,
                title: "Collaboration Hubs",
                description: "Create or join teams. Work together, exchange feedback, and build bigger things faster.",
                color: "text-green-500",
                bgColor: "bg-green-500/10"
              },
              {
                icon: Rocket,
                title: "Showcase & Portfolio",
                description: "Turn your DevSpace profile into a living portfolio — your achievements, your repositories, your journey, all in one place.",
                color: "text-purple-500",
                bgColor: "bg-purple-500/10"
              },
              {
                icon: BookOpen,
                title: "Learning Through Building",
                description: "Get inspired by what others are building. Explore open projects, clone ideas, learn new stacks, and contribute to real work.",
                color: "text-orange-500",
                bgColor: "bg-orange-500/10"
              },
              {
                icon: Shield,
                title: "Powered by GitHub & Firebase",
                description: "Authenticate securely, manage repos effortlessly, and collaborate in real-time with industry-standard tools.",
                color: "text-indigo-500",
                bgColor: "bg-indigo-500/10"
              },
              {
                icon: Globe2,
                title: "Global Community",
                description: "Connect with developers across schools, regions, and countries. A shared environment where talent grows through visibility, not seniority.",
                color: "text-teal-500",
                bgColor: "bg-teal-500/10"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-all duration-300 group cursor-pointer"
              >
                <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Developer Activity Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                  Real Developer{" "}
                  <span className="text-primary">Activity</span>
                </h2>
                <p className="text-xl text-muted-foreground mb-8">
                  See how developers are actively collaborating, building projects, and growing together on DevSpace.
                  Join a community that's already making a difference.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-card rounded-lg p-6 border border-border">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <GitCommit className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">500+</div>
                      <div className="text-sm text-muted-foreground">Active Developers</div>
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-lg p-6 border border-border">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <Code2 className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">200+</div>
                      <div className="text-sm text-muted-foreground">Projects Built</div>
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-lg p-6 border border-border">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">1.2k+</div>
                      <div className="text-sm text-muted-foreground">Collaborations</div>
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-lg p-6 border border-border">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">95%</div>
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <Image
                src="/Developer-activity.png"
                alt="Developer Activity on DevSpace"
                width={600}
                height={400}
                className="rounded-2xl shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Blog & Learning Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Learn, Share, and{" "}
              <span className="text-primary">Grow Together</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover insights, tutorials, and stories from the DevSpace community.
              From beginner guides to advanced techniques, learn from developers who've been there.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="bg-card border border-border rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-foreground mb-4">Featured Blog Post</h3>
                <p className="text-muted-foreground mb-6">
                  "From First Commit to First Job: A Developer's Journey Through DevSpace"
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Read how Sarah, a computer science student, used DevSpace to build her portfolio,
                  connect with mentors, and land her dream job at a tech startup.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">By Sarah Chen • 2 days ago</span>
                  <Button variant="outline" size="sm">
                    Read More
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2">Tutorials</h4>
                  <p className="text-sm text-muted-foreground">Step-by-step coding guides</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2">Showcases</h4>
                  <p className="text-sm text-muted-foreground">Amazing project breakdowns</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2">Career Tips</h4>
                  <p className="text-sm text-muted-foreground">Industry insights & advice</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2">Community</h4>
                  <p className="text-sm text-muted-foreground">Stories from developers</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <Image
                src="/illustrations/Blog-post.png"
                alt="Blog and Learning"
                width={600}
                height={400}
                className="rounded-2xl shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Creator Section */}
      <section className="py-20 bg-background">
        <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="max-w-[1560px] mx-auto">
              <div className="bg-card border border-border rounded-2xl p-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <Code2 className="w-10 h-10 text-primary-foreground" />
                </motion.div>

                <h3 className="text-3xl font-bold text-foreground mb-4">Built by King Jethro</h3>
                <p className="text-xl text-muted-foreground mb-8 max-w-[1560px] mx-auto">
                  A passionate developer who believes in the power of community and collaboration.
                  Building tools that bring developers together and make the world a better place through code.
                </p>

                <div className="flex justify-center gap-4">
                  <a
                    href="https://github.com/kingjethro999"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
                  >
                    <Github className="w-5 h-5 mr-2" />
                    GitHub
                  </a>
                  <span className="inline-flex items-center px-6 py-3 bg-muted text-muted-foreground rounded-lg">
                    @kingjethro999
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Community & Collaboration Section */}
      <section className="py-20 bg-background">
        <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                  Building Together Is{" "}
                  <span className="text-primary">Better</span>
                </h2>
                <p className="text-xl text-muted-foreground mb-8">
                  DevSpace is a community of developers helping each other become better.
                  We don't just share finished products — we share <strong>journeys.</strong>
                </p>
                <p className="text-lg text-muted-foreground mb-8">
                  From your first commit to your product launch, DevSpace lets you tell your story:
                  what you're building, what you're learning, and who's building with you.
                </p>
                <p className="text-lg text-muted-foreground mb-8">
                  It's a place to find collaborators, mentors, and teammates who share your drive to create.
                  Because code isn't just about syntax — it's about the people who bring it to life.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Globe, text: "Project Rooms", description: "Collaborate live on shared codebases", color: "text-blue-500" },
                  { icon: Rocket, text: "Launch Stories", description: "Showcase your journey from idea to reality", color: "text-purple-500" },
                  { icon: Users2, text: "Connections", description: "Follow and interact with other devs", color: "text-green-500" },
                  { icon: BookOpen, text: "Open Learning", description: "No barriers, no intimidation — just shared knowledge", color: "text-orange-500" }
                ].map((feature, index) => (
                  <div
                    key={feature.text}
                    className="flex items-start space-x-3 p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className={`w-5 h-5 ${feature.color}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">{feature.text}</h4>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <Image
                src="/illustrations/Live_collaboration.png"
                alt="Community Collaboration"
                width={600}
                height={400}
                className="rounded-2xl shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Beyond the School - Vision Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Born on Campus.{" "}
              <span className="text-primary">Built for Every Developer.</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto mb-8">
              DevSpace began as a university initiative — but we're not stopping there.
              The mission is bigger: to connect developers across schools, regions, and countries.
              A shared environment where talent grows through visibility, not seniority.
            </p>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
              Every developer deserves a platform to showcase what they can do.
              DevSpace is that platform — open, inclusive, and built for the next generation of innovators.
            </p>
            <div className="bg-card border border-border rounded-2xl p-8 max-w-2xl mx-auto">
              <p className="text-xl font-semibold text-foreground italic">
                "Because no idea should stay hidden. No developer should build alone."
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe2 className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Global Reach</h3>
              <p className="text-muted-foreground">Connect with developers across schools, regions, and countries</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users2 className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Inclusive Community</h3>
              <p className="text-muted-foreground">Open to all developers regardless of experience level or background</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-10 h-10 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Next Generation</h3>
              <p className="text-muted-foreground">Built for the next generation of innovators and creators</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Real Developer Activity Section - Enhanced */}
      <section className="py-20 bg-background">
        <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              See DevSpace in{" "}
              <span className="text-primary">Action</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Watch how developers are actively collaborating, building projects, and growing together on DevSpace.
              Join a community that's already making a difference.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-card rounded-lg p-6 border border-border">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <GitCommit className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">500+</div>
                      <div className="text-sm text-muted-foreground">Active Developers</div>
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-lg p-6 border border-border">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <Code2 className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">200+</div>
                      <div className="text-sm text-muted-foreground">Projects Built</div>
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-lg p-6 border border-border">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">1.2k+</div>
                      <div className="text-sm text-muted-foreground">Collaborations</div>
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-lg p-6 border border-border">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">95%</div>
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <Image
                src="/illustrations/Developer-activity3.png"
                alt="Developer Activity on DevSpace"
                width={600}
                height={400}
                className="rounded-2xl shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact & Support Section */}
      <section className="py-20 bg-background">
        <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                  Need Help?{" "}
                  <span className="text-primary">We're Here</span>
                </h2>
                <p className="text-xl text-muted-foreground mb-8">
                  Have questions about DevSpace? Need help getting started?
                  Our community and support team are here to help you succeed.
                </p>
              </div>

              <div className="space-y-6">
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Community Support</h3>
                      <p className="text-muted-foreground mb-3">
                        Get help from fellow developers in our active community discussions.
                      </p>
                      <Button variant="outline" size="sm">
                        Join Discussion
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Documentation</h3>
                      <p className="text-muted-foreground mb-3">
                        Comprehensive guides and tutorials to help you get the most out of DevSpace.
                      </p>
                      <Button variant="outline" size="sm">
                        Read Docs
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users2 className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Direct Support</h3>
                      <p className="text-muted-foreground mb-3">
                        Can't find what you're looking for? Contact our support team directly.
                      </p>
                      <Link href="/contact">
                        <Button variant="outline" size="sm">
                          Contact Us
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <Image
                src="/illustrations/Contact-us.png"
                alt="Contact and Support"
                width={600}
                height={400}
                className="rounded-2xl shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Step Into the Space.<br />
              <span className="text-primary">
                Build. Connect. Launch.
              </span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-[1560px] mx-auto">
              DevSpace is waiting for you — a place where your code meets opportunity.
              Connect with developers who think like you. Share your projects with people who understand your passion.
              Learn, teach, and grow — together.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="px-8 py-4 text-lg">
                  🌟 Join Now with GitHub
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="px-8 py-4 text-lg">
                  🔥 Sign in with Firebase
                </Button>
              </Link>
            </div>

            <p className="text-muted-foreground text-sm mt-8">
              DevSpace — Empowering Developers to Build Without Boundaries.<br />
              © 2025 DevSpace. All rights reserved.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Floating AI Chat Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
        onClick={() => setAiChatOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 z-40"
      >
        <Bot className="w-6 h-6 text-primary-foreground" />
      </motion.button>

      {/* AI Chat Modal */}
      <Dialog open={aiChatOpen} onOpenChange={setAiChatOpen}>
        <DialogContent className="max-w-[1560px] h-[600px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-foreground">
              <Bot className="w-5 h-5" />
              <span>Glow AI by DevSpace</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex flex-col space-y-4">
            {/* Chat History */}
            <div className="flex-1 overflow-y-auto space-y-4 max-h-96">
              {chatHistory.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>Hi! I'm Glow AI by DevSpace. Ask me anything about development, coding, or DevSpace!</p>
                </div>
              )}

              {chatHistory.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                      }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none prose-headings:text-current prose-p:text-current prose-strong:text-current prose-code:text-current prose-pre:text-current">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted text-muted-foreground px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="flex space-x-2">
              <Input
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleAiChat(chatMessage)}
                placeholder="Ask Glow AI anything..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={() => handleAiChat(chatMessage)}
                disabled={!chatMessage.trim() || isLoading}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
