"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Activity, Database as DbIcon, MessageSquare, FileText } from "lucide-react"
import { UniversalNav } from "@/components/universal-nav"
import { db } from "@/lib/firebase"
import { collection, getCountFromServer, getDocs, query, Timestamp, where } from "firebase/firestore"

interface PerformanceMetrics {
  activeUsers15m: number
  activities24h: number
  discussions24h: number
  messages24h: number
}

export default function PerformancePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    activeUsers15m: 0,
    activities24h: 0,
    discussions24h: 0,
    messages24h: 0,
  })
  const [loadingStats, setLoadingStats] = useState(true)
  const fifteenMinutesAgo = useMemo(() => Timestamp.fromDate(new Date(Date.now() - 15 * 60 * 1000)), [])
  const dayAgo = useMemo(() => Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)), [])

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
    if (!loading && user && user.uid !== 'RDPjwQSWiXMEqvL06qURO5yVrWv1') {
      router.push("/discover")
    }
  }, [user, loading, router])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user || user.uid !== 'RDPjwQSWiXMEqvL06qURO5yVrWv1') {
    return null
  }

  useEffect(() => {
    let isMounted = true
    async function load() {
      try {
        setLoadingStats(true)
        const [recentActivitiesSnap, activities24hAgg, discussions24hAgg, messages24hAgg] = await Promise.all([
          getDocs(query(collection(db, "activities"), where("created_at", ">=", fifteenMinutesAgo))),
          getCountFromServer(query(collection(db, "activities"), where("created_at", ">=", dayAgo))),
          getCountFromServer(query(collection(db, "discussions"), where("created_at", ">=", dayAgo))),
          getCountFromServer(query(collection(db, "messages"), where("created_at", ">=", dayAgo))),
        ])

        const activeSet = new Set<string>()
        recentActivitiesSnap.forEach((d) => {
          const data = d.data() as any
          if (data && data.user_id) activeSet.add(data.user_id)
        })

        if (!isMounted) return
        setMetrics({
          activeUsers15m: activeSet.size,
          activities24h: activities24hAgg.data().count,
          discussions24h: discussions24hAgg.data().count,
          messages24h: messages24hAgg.data().count,
        })
      } catch (e) {
        if (!isMounted) return
        setMetrics({ activeUsers15m: 0, activities24h: 0, discussions24h: 0, messages24h: 0 })
      } finally {
        if (isMounted) setLoadingStats(false)
      }
    }
    load()
    const interval = setInterval(load, 60_000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [dayAgo, fifteenMinutesAgo])

  return (
    <div className="min-h-screen bg-background">
      <UniversalNav />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Performance Metrics</h1>
          <p className="text-muted-foreground">Dev Space Admin Dashboard by <span className="text-blue-400 font-semibold">King Jethro</span></p>
        </div>

        <MetricsGrid
          loadingStats={loadingStats}
          metrics={metrics}
        />

        <div className="bg-slate-900 border border-slate-700 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Optimization Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-blue-400">Caching Strategy</h3>
              <ul className="text-sm text-slate-300 space-y-2">
                <li>✓ In-memory cache with TTL</li>
                <li>✓ Firestore query caching</li>
                <li>✓ User data memoization</li>
                <li>✓ Search result caching</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-cyan-400">Query Optimization</h3>
              <ul className="text-sm text-slate-300 space-y-2">
                <li>✓ Batch operations</li>
                <li>✓ Debounced search</li>
                <li>✓ Lazy loading</li>
                <li>✓ Pagination support</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-green-400">Real-time Features</h3>
              <ul className="text-sm text-slate-300 space-y-2">
                <li>✓ Firestore listeners</li>
                <li>✓ Activity streaming</li>
                <li>✓ Notification push</li>
                <li>✓ Message sync</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-purple-400">Frontend Performance</h3>
              <ul className="text-sm text-slate-300 space-y-2">
                <li>✓ Code splitting</li>
                <li>✓ Image optimization</li>
                <li>✓ Component memoization</li>
                <li>✓ Route prefetching</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function MetricsGrid({ loadingStats, metrics }: { loadingStats: boolean; metrics: PerformanceMetrics }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-200">Active Users (15m)</h3>
          <Activity className="w-5 h-5 text-green-400" />
        </div>
        <div className="text-3xl font-bold text-green-400">{loadingStats ? "—" : metrics.activeUsers15m.toLocaleString()}</div>
        <p className="text-xs text-slate-400 mt-2">Distinct users via recent activity</p>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-200">Activities (24h)</h3>
          <DbIcon className="w-5 h-5 text-blue-400" />
        </div>
        <div className="text-3xl font-bold text-blue-400">{loadingStats ? "—" : metrics.activities24h.toLocaleString()}</div>
        <p className="text-xs text-slate-400 mt-2">Events recorded</p>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-200">Discussions (24h)</h3>
          <FileText className="w-5 h-5 text-yellow-400" />
        </div>
        <div className="text-3xl font-bold text-yellow-400">{loadingStats ? "—" : metrics.discussions24h.toLocaleString()}</div>
        <p className="text-xs text-slate-400 mt-2">Threads created</p>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-200">Messages (24h)</h3>
          <MessageSquare className="w-5 h-5 text-purple-400" />
        </div>
        <div className="text-3xl font-bold text-purple-400">{loadingStats ? "—" : metrics.messages24h.toLocaleString()}</div>
        <p className="text-xs text-slate-400 mt-2">Direct messages sent</p>
      </div>
    </div>
  )
}
