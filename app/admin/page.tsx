"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { UniversalNav } from "@/components/universal-nav"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Settings,
  Users,
  ShieldCheck,
  Flag,
  MessageSquare,
  Bell,
  Mail,
  LineChart,
  BookOpen,
  FolderGit2,
  Database,
  Wrench,
} from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, getCountFromServer, getDocs, query, Timestamp, where } from "firebase/firestore"

export default function AdminDashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalProjects: 0,
    pendingCollabRequests: 0,
    activeUsers15m: 0,
  })
  const [loadingStats, setLoadingStats] = useState(true)

  const fifteenMinutesAgo = useMemo(() => Timestamp.fromDate(new Date(Date.now() - 15 * 60 * 1000)), [])

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
    if (!loading && user && user.uid !== "RDPjwQSWiXMEqvL06qURO5yVrWv1") {
      router.push("/discover")
    }
  }, [user, loading, router])

  useEffect(() => {
    let isMounted = true
    async function loadStats() {
      try {
        setLoadingStats(true)
        const [projectsAgg, pendingReqAgg, recentActivitiesSnap] = await Promise.all([
          getCountFromServer(collection(db, "projects")),
          getCountFromServer(query(collection(db, "collaboration_requests"), where("status", "==", "pending"))),
          getDocs(query(collection(db, "activities"), where("created_at", ">=", fifteenMinutesAgo))),
        ])

        const activeUserIds = new Set<string>()
        recentActivitiesSnap.forEach((doc) => {
          const d = doc.data() as any
          if (d && d.user_id) activeUserIds.add(d.user_id)
        })

        if (!isMounted) return
        setStats({
          totalProjects: projectsAgg.data().count,
          pendingCollabRequests: pendingReqAgg.data().count,
          activeUsers15m: activeUserIds.size,
        })
      } catch (e) {
        // Fail silently in UI but avoid demo numbers
        if (!isMounted) return
        setStats({ totalProjects: 0, pendingCollabRequests: 0, activeUsers15m: 0 })
      } finally {
        if (isMounted) setLoadingStats(false)
      }
    }
    loadStats()

    const interval = setInterval(loadStats, 60_000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [fifteenMinutesAgo])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user || user.uid !== "RDPjwQSWiXMEqvL06qURO5yVrWv1") {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <UniversalNav />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Full platform management. Built by <span className="text-blue-400 font-semibold">King Jethro</span>.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/performance">
              <Button variant="secondary" className="gap-2">
                <LineChart className="w-4 h-4" /> Performance
              </Button>
            </Link>
            <Link href="/docs">
              <Button className="gap-2">
                <BookOpen className="w-4 h-4" /> Admin Docs
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-5 bg-slate-900 border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-300">Active Users (15m)</span>
              <Users className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-green-400">{loadingStats ? "—" : stats.activeUsers15m.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">Distinct users via recent activity</p>
          </Card>
          <Card className="p-5 bg-slate-900 border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-300">Total Projects</span>
              <FolderGit2 className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-bold text-cyan-400">{loadingStats ? "—" : stats.totalProjects.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">Public + private</p>
          </Card>
          <Card className="p-5 bg-slate-900 border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-300">Pending Collab Requests</span>
              <Flag className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold text-yellow-400">{loadingStats ? "—" : stats.pendingCollabRequests.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">Awaiting review</p>
          </Card>
          <Card className="p-5 bg-slate-900 border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-300">Discussions (24h)</span>
              <MessageSquare className="w-4 h-4 text-purple-400" />
            </div>
            <LiveCount collectionName="discussions" windowMinutes={1440} iconColorClass="text-purple-400" />
          </Card>
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-slate-900 border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-semibold text-white">User Management</h2>
              </div>
              <Badge variant="secondary">Moderation</Badge>
            </div>
            <p className="text-sm text-slate-300 mb-4">Approve, suspend, or verify users. Manage roles and access levels.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" className="gap-2">
                <ShieldCheck className="w-4 h-4" /> Verify Accounts
              </Button>
              <Button variant="secondary" className="gap-2">
                <Users className="w-4 h-4" /> Manage Roles
              </Button>
              <Button variant="secondary" className="gap-2">
                <Flag className="w-4 h-4" /> Review Reports
              </Button>
              <Link href="/search">
                <Button className="gap-2">
                  <Database className="w-4 h-4" /> Find Users
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-6 bg-slate-900 border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-semibold text-white">Project Governance</h2>
              </div>
              <Badge variant="secondary">Visibility</Badge>
            </div>
            <p className="text-sm text-slate-300 mb-4">Promote, feature, or restrict projects. Handle takedowns and compliance.</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/projects">
                <Button variant="secondary" className="gap-2">
                  <FolderGit2 className="w-4 h-4" /> Browse Projects
                </Button>
              </Link>
              <Button variant="secondary" className="gap-2">
                <Flag className="w-4 h-4" /> Review Takedowns
              </Button>
              <Button variant="secondary" className="gap-2">
                <Wrench className="w-4 h-4" /> Feature Flags
              </Button>
            </div>
          </Card>

          <Card className="p-6 bg-slate-900 border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-400" />
                <h2 className="text-xl font-semibold text-white">Community & Discussions</h2>
              </div>
              <Badge variant="secondary">Engagement</Badge>
            </div>
            <p className="text-sm text-slate-300 mb-4">Moderate posts and comments, resolve reports, and manage categories.</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/discussions">
                <Button variant="secondary" className="gap-2">
                  <MessageSquare className="w-4 h-4" /> All Discussions
                </Button>
              </Link>
              <Button variant="secondary" className="gap-2">
                <Flag className="w-4 h-4" /> Content Reports
              </Button>
              <Button variant="secondary" className="gap-2">
                <Bell className="w-4 h-4" /> Announcements
              </Button>
            </div>
          </Card>

          <Card className="p-6 bg-slate-900 border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-semibold text-white">Email & Notifications</h2>
              </div>
              <Badge variant="secondary">Comms</Badge>
            </div>
            <p className="text-sm text-slate-300 mb-4">Broadcast emails, manage templates, and tune notification preferences.</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/api/send-email">
                <Button variant="secondary" className="gap-2">
                  <Mail className="w-4 h-4" /> Send Test Email
                </Button>
              </Link>
              <Button variant="secondary" className="gap-2">
                <Bell className="w-4 h-4" /> Push Campaign
              </Button>
              <Link href="/docs#email-system">
                <Button className="gap-2">
                  <BookOpen className="w-4 h-4" /> Email Docs
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-6 bg-slate-900 border-slate-700 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-yellow-400" />
                <h2 className="text-xl font-semibold text-white">Platform Settings</h2>
              </div>
              <Badge variant="secondary">System</Badge>
            </div>
            <p className="text-sm text-slate-300 mb-4">High-level configuration, rate limits, auth providers, and integration keys.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" className="gap-2">
                <Settings className="w-4 h-4" /> General
              </Button>
              <Button variant="secondary" className="gap-2">
                <Database className="w-4 h-4" /> Data & Backups
              </Button>
              <Button variant="secondary" className="gap-2">
                <ShieldCheck className="w-4 h-4" /> Security
              </Button>
              <Link href="/admin/performance">
                <Button className="gap-2">
                  <LineChart className="w-4 h-4" /> Performance
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}

function LiveCount({ collectionName, windowMinutes, iconColorClass }: { collectionName: string; windowMinutes: number; iconColorClass?: string }) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let isMounted = true
    async function load() {
      try {
        const threshold = Timestamp.fromDate(new Date(Date.now() - windowMinutes * 60 * 1000))
        const agg = await getCountFromServer(query(collection(db, collectionName), where("created_at", ">=", threshold)))
        if (!isMounted) return
        setCount(agg.data().count)
      } catch {
        if (!isMounted) return
        setCount(0)
      }
    }
    load()
    const interval = setInterval(load, 60_000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [collectionName, windowMinutes])

  return (
    <div>
      <div className={`text-3xl font-bold ${iconColorClass || "text-slate-200"}`}>{count === null ? "—" : count.toLocaleString()}</div>
      <p className="text-xs text-slate-500 mt-1">Created in last {Math.round(windowMinutes / 60)}h</p>
    </div>
  )
}


