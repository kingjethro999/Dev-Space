"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  Clock, 
  Trophy, 
  TrendingUp, 
  Target,
  Zap,
  BookOpen,
  Code,
  Users,
  MessageSquare,
  Lightbulb,
  Bug,
  Rocket,
  Wrench,
  Globe
} from "lucide-react"
import { JourneyStats } from "@/lib/journey-schema"
import { getJourneyStats } from "@/lib/journey-utils"

interface JourneyStatsCardProps {
  projectId: string
}

export function JourneyStatsCard({ projectId }: JourneyStatsCardProps) {
  const [stats, setStats] = useState<JourneyStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getJourneyStats(projectId)
        setStats(data)
      } catch (error) {
        console.error('Error fetching journey stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [projectId])

  const getEntryTypeIcon = (type: string) => {
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
      breakthrough: TrendingUp,
      maintenance: Wrench,
      scaling: TrendingUp,
      community: Globe,
    }
    return iconMap[type as keyof typeof iconMap] || Code
  }

  const getMoodEmoji = (mood: string) => {
    const moodMap = {
      excited: '😄',
      focused: '🎯',
      frustrated: '😤',
      accomplished: '🎉',
      stuck: '😵',
      inspired: '✨',
      tired: '😴',
      proud: '😌',
      confused: '🤔',
      motivated: '💪',
      overwhelmed: '😰',
      satisfied: '😊',
      curious: '🤓',
    }
    return moodMap[mood as keyof typeof moodMap] || '😐'
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return null
  }

  const totalHours = Math.round(stats.totalTimeSpent / 60)
  const milestoneProgress = stats.totalMilestones > 0 
    ? (stats.milestonesCompleted / stats.totalMilestones) * 100 
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5" />
          <span>Journey Statistics</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.totalEntries}</div>
            <div className="text-sm text-muted-foreground">Total Entries</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalHours}h</div>
            <div className="text-sm text-muted-foreground">Time Spent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.milestonesCompleted}</div>
            <div className="text-sm text-muted-foreground">Milestones</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.skillsLearned.length}</div>
            <div className="text-sm text-muted-foreground">Skills Learned</div>
          </div>
        </div>

        {/* Milestone Progress */}
        {stats.totalMilestones > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Milestone Progress</span>
              <span className="text-sm text-muted-foreground">
                {stats.milestonesCompleted}/{stats.totalMilestones}
              </span>
            </div>
            <Progress value={milestoneProgress} className="h-2" />
          </div>
        )}

        {/* Streaks */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-lg font-bold text-orange-600">{stats.currentStreak}</div>
            <div className="text-sm text-muted-foreground">Current Streak (days)</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-lg font-bold text-blue-600">{stats.longestStreak}</div>
            <div className="text-sm text-muted-foreground">Longest Streak (days)</div>
          </div>
        </div>

        {/* Entry Type Distribution */}
        <div>
          <h4 className="text-sm font-medium mb-3">Entry Types</h4>
          <div className="space-y-2">
            {Object.entries(stats.entryTypeDistribution)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([type, count]) => {
                const Icon = getEntryTypeIcon(type)
                const percentage = (count / stats.totalEntries) * 100
                return (
                  <div key={type} className="flex items-center space-x-3">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                        <span className="text-sm text-muted-foreground">{count}</span>
                      </div>
                      <Progress value={percentage} className="h-1 mt-1" />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* Mood Distribution */}
        {Object.keys(stats.moodDistribution).length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Mood Distribution</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.moodDistribution)
                .sort(([,a], [,b]) => b - a)
                .map(([mood, count]) => (
                  <Badge key={mood} variant="secondary" className="flex items-center space-x-1">
                    <span>{getMoodEmoji(mood)}</span>
                    <span className="capitalize">{mood}</span>
                    <span className="text-xs opacity-70">({count})</span>
                  </Badge>
                ))}
            </div>
          </div>
        )}

        {/* Skills Learned */}
        {stats.skillsLearned.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Skills Learned</h4>
            <div className="flex flex-wrap gap-2">
              {stats.skillsLearned.slice(0, 10).map((skill, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {stats.skillsLearned.length > 10 && (
                <Badge variant="outline" className="text-xs">
                  +{stats.skillsLearned.length - 10} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Energy Level */}
        <div>
          <h4 className="text-sm font-medium mb-3">Average Energy Level</h4>
          <div className="flex items-center space-x-3">
            <Zap className="w-4 h-4 text-yellow-500" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">Energy</span>
                <span className="text-sm text-muted-foreground">
                  {stats.averageEnergy.toFixed(1)}/10
                </span>
              </div>
              <Progress value={(stats.averageEnergy / 10) * 100} className="h-2" />
            </div>
          </div>
        </div>

        {/* Last Activity */}
        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="text-sm text-muted-foreground">Last Entry</div>
          <div className="text-sm font-medium">
            {new Date(stats.lastEntryDate).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

