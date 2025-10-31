"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, TrendingUp, Users, Bug, Rocket } from "lucide-react"
import { getJourneyEntries, getJourneyStats } from "@/lib/journey-utils"

interface JourneyInsightsProps {
  projectId: string
  userId: string
  isOwner: boolean
}

export function JourneyInsights({ projectId }: JourneyInsightsProps) {
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<any[]>([])
  const [stats, setStats] = useState<any | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [e, s] = await Promise.all([
          getJourneyEntries(projectId),
          getJourneyStats(projectId),
        ])
        setEntries(e)
        setStats(s)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projectId])

  const insights = useMemo(() => {
    if (!stats) return [] as Array<{ icon: any; title: string; description: string; tag: string }>

    const weekendEnergy = (() => {
      const weekend = entries.filter((en) => {
        const d = new Date(en.timestamp)
        const day = d.getDay()
        return day === 0 || day === 6
      })
      const avg = weekend.length ? (weekend.reduce((a, b) => a + (b.energy || 0), 0) / weekend.length).toFixed(1) : "0"
      return { avg }
    })()

    const challengeResolution = (() => {
      const challenges = entries.filter((e) => (e.challenges || []).length > 0)
      const solutions = entries.filter((e) => (e.solutions || []).length > 0)
      // naive heuristic: time between challenge and next solution
      let deltas: number[] = []
      for (const c of challenges) {
        const nextSolution = solutions.find((s) => new Date(s.timestamp) > new Date(c.timestamp))
        if (nextSolution) {
          const days = (new Date(nextSolution.timestamp).getTime() - new Date(c.timestamp).getTime()) / (1000 * 60 * 60 * 24)
          deltas.push(days)
        }
      }
      const avgDays = deltas.length ? (deltas.reduce((a, b) => a + b, 0) / deltas.length).toFixed(1) : "0"
      return { avgDays }
    })()

    const collab = (() => {
      const withCollab = entries.filter((e) => (e.collaborators || []).length > 0)
      const baseLen = entries.length ? (entries.reduce((a, b) => a + (b.content?.length || 0), 0) / entries.length) : 0
      const withLen = withCollab.length ? (withCollab.reduce((a, b) => a + (b.content?.length || 0), 0) / withCollab.length) : 0
      const factor = baseLen ? (withLen / baseLen).toFixed(1) : "0"
      return { factor }
    })()

    const milestoneTrend = (() => {
      const last30 = entries.filter((e) => (new Date().getTime() - new Date(e.timestamp).getTime()) < 30 * 24 * 3600 * 1000)
      const completed = last30.filter((e) => e.isMilestone).length
      return { completed }
    })()

    const skills30 = (() => {
      const last30 = entries.filter((e) => (new Date().getTime() - new Date(e.timestamp).getTime()) < 30 * 24 * 3600 * 1000)
      const set = new Set<string>()
      last30.forEach((e) => (e.skillsLearned || []).forEach((s: string) => set.add(s)))
      return { count: set.size }
    })()

    return [
      {
        icon: Lightbulb,
        title: "Weekend productivity",
        description: `Average energy on weekends: ${weekendEnergy.avg}/10`,
        tag: "productivity",
      },
      {
        icon: Bug,
        title: "Challenge resolution",
        description: `Avg time from challenge to solution: ${challengeResolution.avgDays} days`,
        tag: "challenges",
      },
      {
        icon: Users,
        title: "Collaboration impact",
        description: `Entries with collaborators are ~${collab.factor}x longer`,
        tag: "collaboration",
      },
      {
        icon: Rocket,
        title: "Milestone pace",
        description: `${milestoneTrend.completed} milestones in the last 30 days`,
        tag: "milestones",
      },
      {
        icon: TrendingUp,
        title: "Learning momentum",
        description: `${skills30.count} new skills logged in 30 days`,
        tag: "learning",
      },
    ]
  }, [entries, stats])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {insights.map((insight, idx) => {
        const Icon = insight.icon
        return (
          <Card key={idx} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center space-x-2">
                  <Icon className="w-4 h-4 text-primary" />
                  <span>{insight.title}</span>
                </CardTitle>
                <Badge variant="secondary">{insight.tag}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{insight.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}


