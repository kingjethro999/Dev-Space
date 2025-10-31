"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { db } from "@/lib/firebase"
import { collection, getDocs, orderBy, query, where, limit as fbLimit } from "firebase/firestore"

interface Project {
  id: string
  title: string
  owner_id: string
  hasJourney?: boolean
}

interface JourneyPromptWidgetProps {
  userId: string
}

export function JourneyPromptWidget({ userId }: JourneyPromptWidgetProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [stale, setStale] = useState<Array<{ project: Project; last: Date | null }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        const pq = query(collection(db, "projects"), where("owner_id", "==", userId), orderBy("created_at", "desc"))
        const ps = await getDocs(pq)
        const pjs = ps.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as any[]
        setProjects(pjs)

        // Only process projects that have journeys enabled
        const journeyProjects = pjs.filter((p) => p.hasJourney === true)
        
        const results: Array<{ project: Project; last: Date | null }> = []
        for (const p of journeyProjects) {
          const jq = query(
            collection(db, "journey_entries"),
            where("projectId", "==", p.id),
            orderBy("timestamp", "desc"),
            fbLimit(1)
          )
          const js = await getDocs(jq)
          if (js.empty) {
            results.push({ project: p, last: null })
          } else {
            const d = js.docs[0].data() as any
            const last = d.timestamp?.toDate?.() || new Date()
            results.push({ project: p, last })
          }
        }
        // stale = no entry in last 7 days
        const now = Date.now()
        const staleOnes = results.filter((r) => !r.last || now - (r.last as any).getTime() > 7 * 24 * 3600 * 1000)
        setStale(staleOnes)
      } finally {
        setLoading(false)
      }
    }
    if (userId) run()
  }, [userId])

  if (loading || stale.length === 0) return null

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Your Project Journeys</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stale.slice(0, 3).map(({ project }) => (
          <div key={project.id} className="flex items-center justify-between p-3 bg-muted rounded">
            <div>
              <div className="text-sm text-muted-foreground">Continue your journey on</div>
              <div className="font-medium">{project.title} — any updates since your last log?</div>
            </div>
            <div className="flex gap-2">
              <Link href={`/projects/${project.id}/journey`}>
                <Button size="sm">Add Update</Button>
              </Link>
              <Button size="sm" variant="ghost">Skip</Button>
            </div>
          </div>
        ))}
        {stale.length > 3 && (
          <div className="text-xs text-muted-foreground">And {stale.length - 3} more projects need updates</div>
        )}
      </CardContent>
    </Card>
  )
}


