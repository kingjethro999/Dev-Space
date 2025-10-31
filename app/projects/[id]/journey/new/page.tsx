"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { JourneyEntryForm } from "@/components/journey-entry-form"
import { UniversalNav } from "@/components/universal-nav"
import { CreateJourneyEntryData } from "@/lib/journey-schema"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"

export default function NewJourneyEntryPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  
  const projectId = params.id as string
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [initialData, setInitialData] = useState<Partial<CreateJourneyEntryData>>({})

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/projects/${projectId}`)
    }
  }, [user, authLoading, router, projectId])

  useEffect(() => {
    const fetchProject = async () => {
      try {
        if (!projectId) return
        
        const snap = await getDoc(doc(db, "projects", projectId))
        if (snap.exists()) {
          const data = snap.data()
          setProject({ id: projectId, ...data })
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
    
    if (user) {
      fetchProject()
    }
  }, [projectId, user])

  useEffect(() => {
    // Parse URL parameters to prefill form
    const commitSha = searchParams.get('commitSha')
    const commitMessage = searchParams.get('commitMessage')
    const commitUrl = searchParams.get('commitUrl')
    const repoName = searchParams.get('repoName')

    if (commitMessage && commitSha) {
      const prefilledData: Partial<CreateJourneyEntryData> = {
        type: 'development',
        title: commitMessage.split('\n')[0].substring(0, 100),
        content: commitMessage,
        tags: ['commit', 'github'],
        isPublic: true,
        isMilestone: false,
      }

      // Add sourceRepoUrl if we have commit URL
      if (commitUrl) {
        prefilledData.sourceRepoUrl = commitUrl
      }

      // Add repository name as tag
      if (repoName) {
        prefilledData.tags = [...(prefilledData.tags || []), repoName.toLowerCase()]
      }

      setInitialData(prefilledData)
      
      // Show toast notification
      toast({
        title: "Commit loaded",
        description: "We've prefilled the form with your commit details. Feel free to edit and add more context!",
      })
    }
  }, [searchParams])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Project Not Found</h1>
          <p className="text-muted-foreground mb-6">The project you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <UniversalNav />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push(`/projects/${projectId}/journey`)}
            className="text-primary hover:underline mb-4 inline-block"
          >
            ← Back to Journey
          </button>
          <h1 className="text-3xl font-bold text-foreground">Add Journey Entry</h1>
          <p className="text-muted-foreground">Document your progress and experiences</p>
        </div>

        <JourneyEntryForm
          projectId={projectId}
          userId={user.uid}
          onSuccess={() => {
            toast({
              title: "Entry created!",
              description: "Your journey entry has been added successfully.",
            })
            router.push(`/projects/${projectId}/journey`)
          }}
          onCancel={() => {
            router.push(`/projects/${projectId}/journey`)
          }}
          initialData={initialData}
        />
      </div>
    </div>
  )
}

