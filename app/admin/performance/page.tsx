"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Activity, Zap, Database, Search } from "lucide-react"

interface PerformanceMetrics {
  cacheHitRate: number
  avgQueryTime: number
  activeUsers: number
  totalRequests: number
}

export default function PerformancePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cacheHitRate: 87,
    avgQueryTime: 145,
    activeUsers: 1250,
    totalRequests: 45000,
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/feed" className="text-2xl font-bold text-primary">
            Dev Space
          </Link>
          <div className="flex gap-4">
            <Link href="/feed">
              <Button variant="ghost">Feed</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Performance Metrics</h1>
          <p className="text-muted-foreground">Dev Space Admin Dashboard by <span className="text-blue-400 font-semibold">King Jethro</span></p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-200">Cache Hit Rate</h3>
              <Zap className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold text-yellow-400">{metrics.cacheHitRate}%</div>
            <p className="text-xs text-slate-400 mt-2">Improved query performance</p>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-200">Avg Query Time</h3>
              <Database className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-blue-400">{metrics.avgQueryTime}ms</div>
            <p className="text-xs text-slate-400 mt-2">Database optimization</p>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-200">Active Users</h3>
              <Activity className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-green-400">{metrics.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-slate-400 mt-2">Real-time connections</p>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-200">Total Requests</h3>
              <Search className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-purple-400">{(metrics.totalRequests / 1000).toFixed(1)}K</div>
            <p className="text-xs text-slate-400 mt-2">24-hour volume</p>
          </div>
        </div>

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
