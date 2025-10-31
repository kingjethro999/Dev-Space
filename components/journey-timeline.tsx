"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Calendar, 
  Clock, 
  Heart, 
  MessageCircle, 
  Star, 
  Zap, 
  Target,
  Code,
  BookOpen,
  Bug,
  Rocket,
  Users,
  Lightbulb,
  Trophy,
  Wrench,
  TrendingUp,
  MessageSquare,
  Globe,
  Lock,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  Plus
} from "lucide-react"
import { 
  JourneyEntry, 
  JourneyEntryType, 
  JourneyMood,
  JourneyFilter 
} from "@/lib/journey-schema"
import { subscribeToJourneyEntries, getJourneyStats } from "@/lib/journey-utils"
import { formatDistanceToNow, format } from "date-fns"
import { JourneyEntryCard } from "./journey-entry-card"
import { JourneyStatsCard } from "./journey-stats-card"
import { JourneyFilterPanel } from "./journey-filter-panel"
import { isSubscribedToJourney, subscribeToJourney, unsubscribeFromJourney } from "@/lib/journey-utils"

interface JourneyTimelineProps {
  projectId: string
  userId: string
  isOwner?: boolean
}

export function JourneyTimeline({ projectId, userId, isOwner = false }: JourneyTimelineProps) {
  const [entries, setEntries] = useState<JourneyEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<JourneyEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<JourneyFilter>({
    isPublic: !isOwner, // Show public entries by default for non-owners
  })
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())
  const [subscribed, setSubscribed] = useState<boolean>(false)
  const [subLoading, setSubLoading] = useState<boolean>(true)

  useEffect(() => {
    const unsubscribe = subscribeToJourneyEntries(
      projectId,
      (newEntries) => {
        setEntries(newEntries)
        setLoading(false)
      },
      filters
    )

    return unsubscribe
  }, [projectId, filters])

  useEffect(() => {
    const check = async () => {
      try {
        if (!userId) return
        const ok = await isSubscribedToJourney(projectId, userId)
        setSubscribed(ok)
      } finally {
        setSubLoading(false)
      }
    }
    check()
  }, [projectId, userId])

  useEffect(() => {
    // Apply client-side filtering
    let filtered = entries

    // Hide pending for non-owners unless entry is authored by user
    filtered = filtered.filter((e: any) => {
      if (e.status === 'pending' && !isOwner && e.userId !== userId) return false
      return true
    })

    if (filters.type) {
      filtered = filtered.filter(entry => entry.type === filters.type)
    }
    if (filters.mood) {
      filtered = filtered.filter(entry => entry.mood === filters.mood)
    }
    if (filters.isMilestone !== undefined) {
      filtered = filtered.filter(entry => entry.isMilestone === filters.isMilestone)
    }
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(entry => 
        filters.tags!.some(tag => entry.tags.includes(tag))
      )
    }
    if (filters.skillsLearned && filters.skillsLearned.length > 0) {
      filtered = filtered.filter(entry => 
        filters.skillsLearned!.some(skill => entry.skillsLearned.includes(skill))
      )
    }

    setFilteredEntries(filtered)
  }, [entries, filters, isOwner, userId])

  const getEntryIcon = (type: JourneyEntryType) => {
    const iconMap = {
      ideation: Lightbulb,
      learning: BookOpen,
      development: Code,
      debugging: Bug,
      testing: Target,
      deployment: Rocket,
      collaboration: Users,
      reflection: MessageSquare,
      milestone: Trophy,
      challenge: Wrench,
      breakthrough: Zap,
      maintenance: Wrench,
      scaling: TrendingUp,
      community: Globe,
    }
    return iconMap[type] || Code
  }

  const getMoodColor = (mood?: JourneyMood) => {
    const colorMap = {
      excited: "text-yellow-500",
      focused: "text-blue-500",
      frustrated: "text-red-500",
      accomplished: "text-green-500",
      stuck: "text-gray-500",
      inspired: "text-purple-500",
      tired: "text-orange-500",
      proud: "text-pink-500",
      confused: "text-yellow-600",
      motivated: "text-green-600",
      overwhelmed: "text-red-600",
      satisfied: "text-blue-600",
      curious: "text-purple-600",
    }
    return mood ? colorMap[mood] || "text-gray-500" : "text-gray-400"
  }

  const toggleEntryExpansion = (entryId: string) => {
    setExpandedEntries(prev => {
      const newSet = new Set(prev)
      if (newSet.has(entryId)) {
        newSet.delete(entryId)
      } else {
        newSet.add(entryId)
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading journey...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Project Journey</h2>
          <p className="text-muted-foreground">
            {filteredEntries.length} entries • {entries.filter(e => e.isMilestone).length} milestones
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button
            variant={subscribed ? "secondary" : "default"}
            size="sm"
            disabled={subLoading}
            onClick={async () => {
              try {
                setSubLoading(true)
                if (subscribed) {
                  await unsubscribeFromJourney(projectId, userId)
                  setSubscribed(false)
                } else {
                  await subscribeToJourney(projectId, userId)
                  setSubscribed(true)
                }
              } finally {
                setSubLoading(false)
              }
            }}
          >
            {subscribed ? 'Unsubscribe' : 'Subscribe'}
          </Button>
        </div>
      </div>

      {/* Stats Card */}
      <JourneyStatsCard projectId={projectId} />

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <JourneyFilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              onClose={() => setShowFilters(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>

        <div className="space-y-6">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No journey entries yet</h3>
              <p className="text-muted-foreground mb-4">
                Start documenting your project journey to track your progress and share your experience.
              </p>
              {isOwner && (
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Entry
                </Button>
              )}
            </div>
          ) : (
            filteredEntries.map((entry, index) => {
              const Icon = getEntryIcon(entry.type)
              const isExpanded = expandedEntries.has(entry.id)
              const isLast = index === filteredEntries.length - 1

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="relative"
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-6 w-3 h-3 bg-primary rounded-full border-4 border-background transform -translate-x-1/2 z-10">
                    {entry.isMilestone && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full"></div>
                    )}
                  </div>

                  {/* Entry Card */}
                  <div className="ml-12">
                    <JourneyEntryCard
                      entry={entry}
                      isExpanded={isExpanded}
                      onToggleExpansion={() => toggleEntryExpansion(entry.id)}
                      isOwner={isOwner}
                      showFullContent={isExpanded}
                    />
                  </div>

                  {/* Connection Line */}
                  {!isLast && (
                    <div className="absolute left-6 top-12 w-0.5 h-6 bg-border"></div>
                  )}
                </motion.div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

