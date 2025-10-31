"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getJourneyTemplates } from "@/lib/journey-utils"
import { JourneyTemplate } from "@/lib/journey-schema"
import { Rocket, BookOpen, Code2, Cpu, Globe2 } from "lucide-react"

interface JourneyTemplatesProps {
  projectId: string
  userId: string
  isOwner: boolean
}

export function JourneyTemplates({ isOwner }: JourneyTemplatesProps) {
  const [templates, setTemplates] = useState<JourneyTemplate[]>([])
  const [category, setCategory] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getJourneyTemplates(category || undefined)
        setTemplates(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [category])

  const icons = [Rocket, Code2, Cpu, BookOpen, Globe2]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Journey Templates</h3>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            {['', 'web_app', 'mobile_app', 'api', 'open_source', 'startup', 'learning'].map(c => (
              <SelectItem key={c || 'all'} value={c}>{c ? c.replace('_',' ') : 'All'}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No public templates yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((t, idx) => {
            const Icon = icons[idx % icons.length]
            return (
              <Card key={t.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center space-x-2">
                    <Icon className="w-4 h-4 text-primary" />
                    <span>{t.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{t.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <Badge variant="secondary">{t.category.replace('_',' ')}</Badge>
                    <span className="text-muted-foreground">{t.estimatedDuration} days</span>
                  </div>
                  {isOwner && (
                    <Button size="sm" className="w-full">Use this template</Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}


