"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import {
  Code2, Users, GitBranch, MessageSquare, ArrowRight, Sun, Moon,
  Star, Zap, Shield, Globe, Sparkles, Search, Menu, X,
  Github, Terminal, CheckCircle, Rocket,
  BookOpen, Lightbulb, Globe2, Users2, GitCommit, TrendingUp, Bot
} from "lucide-react"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
import { useAnalytics } from "@/hooks/use-analytics"

function HomeContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  useAnalytics()

  useEffect(() => { setMounted(true) }, [searchParams])
  useEffect(() => { if (!loading && user) router.push("/discover") }, [user, loading, router])

  if (!mounted) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="w-16 h-16 rounded-full border-2 border-primary/20 animate-spin border-t-primary" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent animate-ping border-t-primary/30" />
          </div>
          <p className="text-muted-foreground text-sm font-medium tracking-wide">Initializing DevSpace…</p>
        </div>
      </div>
    )
  }

  if (user) return null

  const navLinks = [
    { href: "/docs", label: "Docs" },
    { href: "/auth/signup?redirect=/discussions", label: "Community" },
    { href: "/contact", label: "Contact" },
  ]

  const features = [
    { icon: Code2, title: "Project Launchpad", desc: "Share projects, track progress, and showcase your story from idea to launch.", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
    { icon: Users2, title: "Collaboration Hubs", desc: "Create or join teams. Exchange feedback and build bigger things faster.", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
    { icon: Rocket, title: "Living Portfolio", desc: "Turn your DevSpace profile into a living portfolio — achievements, repos, journey.", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
    { icon: BookOpen, title: "Learn by Building", desc: "Explore open projects, clone ideas, learn new stacks, contribute to real work.", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { icon: Bot, title: "Glow AI Assistant", desc: "AI-powered code analysis, indexing, and instant answers for any project.", color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" },
    { icon: Globe2, title: "Global Community", desc: "Connect across schools, regions, and countries. Talent grows through visibility.", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  ]

  const stats = [
    { icon: GitCommit, value: "500+", label: "Active Developers", color: "text-indigo-400", bg: "bg-indigo-500/10" },
    { icon: Code2, value: "200+", label: "Projects Built", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { icon: MessageSquare, value: "1.2k+", label: "Collaborations", color: "text-violet-400", bg: "bg-violet-500/10" },
    { icon: TrendingUp, value: "95%", label: "Success Rate", color: "text-amber-400", bg: "bg-amber-500/10" },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Image src="/dev-space-icon-transparent.png" alt="DevSpace" width={24} height={24} className="rounded-lg" priority />
              </div>
              <span className="text-lg font-bold tracking-tight">DevSpace</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {navLinks.map(l => (
                <Link key={l.href} href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="w-9 h-9">
                <Sun className="h-4 w-4 rotate-0 scale-100 dark:-rotate-90 dark:scale-0 transition-all" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 dark:rotate-0 dark:scale-100 transition-all" />
              </Button>
              <Link href="/auth/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link href="/auth/signup"><Button size="sm" className="btn-glow bg-primary hover:bg-primary/90">Get Started <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Button></Link>
            </div>

            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden border-t border-border/50 py-4 space-y-3"
              >
                {navLinks.map(l => (
                  <Link key={l.href} href={l.href} onClick={() => setMobileMenuOpen(false)}
                    className="block px-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link>
                ))}
                <div className="pt-2 border-t border-border/50 flex flex-col gap-2">
                  <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}><Button variant="ghost" className="w-full justify-start">Sign in</Button></Link>
                  <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}><Button className="w-full">Get Started</Button></Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-24 md:pt-44 md:pb-32 overflow-hidden hero-mesh grid-bg">
        {/* Floating orbs */}
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-violet-500/6 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-sm text-primary font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Built for the next generation of developers</span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center max-w-4xl mx-auto mb-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
              Where Developers{" "}
              <span className="gradient-text">Connect, Build,</span>
              <br />and{" "}
              <span className="gradient-text">Grow Together</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              DevSpace bridges the gap between student developers and the wider tech world.
              Share projects, collaborate, and grow — regardless of level, age, or background.
            </p>
          </motion.div>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}
            className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Link href="/auth/signup">
              <Button size="lg" className="btn-glow bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-12 text-base font-semibold rounded-xl">
                Join DevSpace <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/discover">
              <Button size="lg" variant="outline" className="px-8 h-12 text-base font-semibold rounded-xl border-border/60 hover:border-primary/40 hover:bg-primary/5">
                Explore Projects
              </Button>
            </Link>
          </motion.div>

          {/* Feature pills */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-3">
            {[
              { icon: MessageSquare, text: "Community Discussions" },
              { icon: Code2, text: "Project Showcase" },
              { icon: Bot, text: "Glow AI Assistant" },
              { icon: Globe2, text: "Global Network" },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-2 px-4 py-2 glass-card text-sm text-muted-foreground font-medium">
                <item.icon className="w-4 h-4 text-primary" />
                {item.text}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-16 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="premium-card p-6 text-center group">
                <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div className="text-2xl md:text-3xl font-extrabold tracking-tight mb-1">{s.value}</div>
                <div className="text-xs md:text-sm text-muted-foreground">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/60 bg-muted/50 text-xs text-muted-foreground font-medium mb-4">
              <Zap className="w-3 h-3" /> Everything you need
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
              Your Developer Journey,{" "}
              <span className="gradient-text">All in One Space</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We don't just share finished products — we share journeys.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className={`premium-card p-6 border ${f.border} group`}>
                <div className={`w-12 h-12 ${f.bg} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROBLEM / SOLUTION ── */}
      <section className="py-24 bg-muted/20 border-y border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-14">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
              A Place for Every Developer —{" "}
              <span className="gradient-text">From Classroom to Cosmos</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl">
              DevSpace started as a campus idea to connect brilliant but isolated developers. We saw coders working in silence because of age gaps, level differences, or simply not knowing where to start.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Problem */}
            <div className="premium-card p-8 border border-red-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                  <X className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-red-400 uppercase tracking-widest">The Problem</div>
                  <h3 className="font-bold text-lg">Developers are everywhere — but connection is missing</h3>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { icon: Users, text: "Working in Silence", desc: "Brilliant coders building alone" },
                  { icon: BookOpen, text: "Level Barriers", desc: "Age and experience gaps blocking collaboration" },
                  { icon: Globe, text: "No Starting Point", desc: "Not knowing where to begin connecting" },
                ].map(item => (
                  <div key={item.text} className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                    <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{item.text}</div>
                      <div className="text-xs text-muted-foreground">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Solution */}
            <div className="premium-card p-8 border border-emerald-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest">The Solution</div>
                  <h3 className="font-bold text-lg">DevSpace — building together is better</h3>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { icon: Users2, text: "Easy Connections", desc: "Find developers who share your passion" },
                  { icon: Rocket, text: "Project Showcase", desc: "Share your journey from idea to launch" },
                  { icon: Lightbulb, text: "Passion-Based", desc: "Collaboration based on curiosity, not level" },
                ].map(item => (
                  <div key={item.text} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{item.text}</div>
                      <div className="text-xs text-muted-foreground">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 hero-mesh pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs text-primary font-medium mb-6">
              <Star className="w-3 h-3" /> Join 500+ developers already building
            </div>
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
              Step Into the Space.
              <br />
              <span className="gradient-text">Build. Connect. Launch.</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
              DevSpace is waiting for you — where your code meets opportunity.
              Share projects, find teammates, and grow together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="btn-glow bg-primary hover:bg-primary/90 text-primary-foreground px-10 h-13 text-base font-semibold rounded-xl">
                  <Github className="mr-2 h-4 w-4" /> Join with GitHub
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="px-10 h-13 text-base font-semibold rounded-xl border-border/60 hover:border-primary/40">
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
              <Terminal className="w-3 h-3 text-primary" />
            </div>
            <span>DevSpace — built by <a href="https://github.com/kingjethro999" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">King Jethro</a></span>
          </div>
          <p>© 2025 DevSpace. Empowering developers to build without boundaries.</p>
        </div>
      </footer>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
