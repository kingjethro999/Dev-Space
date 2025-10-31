"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, 
  ArrowLeft, 
  Calendar, 
  TrendingUp, 
  Target,
  BookOpen,
  Users,
  Settings,
  Filter,
  Search
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { JourneyTimeline } from "@/components/journey-timeline"
import { JourneyEntryForm } from "@/components/journey-entry-form"
import { JourneyStatsCard } from "@/components/journey-stats-card"
import { JourneyTemplates } from "@/components/journey-templates"
import { JourneyInsights } from "@/components/journey-insights"
import { JourneyMilestones } from "@/components/journey-milestones"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { UniversalNav } from "@/components/universal-nav"

export default function ProjectJourneyPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showEntryForm, setShowEntryForm] = useState(false)
  const [activeTab, setActiveTab] = useState("timeline")
  const [canContribute, setCanContribute] = useState(false)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        if (!id) return
        const snap = await getDoc(doc(db, "projects", id as string))
        if (snap.exists()) {
          const data = snap.data() as any
          setProject({ id, title: data.title, description: data.description, owner: data.owner_id, collaboration_type: data.collaboration_type || 'solo' })
        } else {
          setProject(null)
        }
      } catch (error) {
        console.error('Error fetching project:', error)
        setProject(null)
      } finally {
        setLoading(false)
      }
    }
    if (user) fetchProject()
  }, [id, user])

  useEffect(() => {
    const checkPermissions = async () => {
      if (!project || !user) return
      const isOwner = user.uid === project.owner
      if (isOwner) {
        setCanContribute(true)
        return
      }
      if (project.collaboration_type === 'open') {
        setCanContribute(true)
        return
      }
      // authorized: check collaborations
      const qy = query(collection(db, 'collaborations'), where('project_id', '==', id as string), where('user_id', '==', user.uid))
      const snap = await getDocs(qy)
      setCanContribute(!snap.empty)
    }
    checkPermissions()
  }, [project, user, id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project journey...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Project Not Found</h1>
          <p className="text-muted-foreground mb-6">The project you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => router.push('/projects')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  const isOwner = user?.uid === project.owner

  return (
    <div className="min-h-screen bg-background">
      <UniversalNav />
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/projects/${id}`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Project
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  {project.title} Journey
                </h1>
                <p className="text-sm text-muted-foreground">
                  Track your development progress and share your experience
                </p>
              </div>
            </div>

            {canContribute && (
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setShowEntryForm(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Entry</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="timeline" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Timeline</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Statistics</span>
            </TabsTrigger>
            <TabsTrigger value="milestones" className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Milestones</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4" />
              <span>Templates</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Insights</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-6">
            <JourneyTimeline 
              projectId={id as string} 
              userId={user?.uid || ''} 
              isOwner={isOwner}
            />
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <JourneyStatsCard projectId={id as string} />
          </TabsContent>

          <TabsContent value="milestones" className="space-y-6">
            <JourneyMilestones 
              projectId={id as string} 
              userId={user?.uid || ''} 
              isOwner={isOwner}
            />
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <JourneyTemplates 
              projectId={id as string} 
              userId={user?.uid || ''} 
              isOwner={isOwner}
            />
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <JourneyInsights 
              projectId={id as string} 
              userId={user?.uid || ''} 
              isOwner={isOwner}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Entry Form Modal */}
      {showEntryForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-7xl h-full overflow-y-auto">
            <JourneyEntryForm
              projectId={id as string}
              userId={user?.uid || ''}
              onSuccess={() => {
                setShowEntryForm(false)
                // Refresh the timeline
                window.location.reload()
              }}
              onCancel={() => setShowEntryForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

