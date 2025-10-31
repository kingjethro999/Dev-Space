"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, onSnapshot, orderBy, getDocs, limit as fbLimit, deleteDoc, addDoc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Users, Code, Github, BookOpen, Share2, Copy, Edit, Trash2 } from "lucide-react"
import { getGitHubRepoStats } from "@/lib/github-utils"
import { UniversalNav } from "@/components/universal-nav"
import { ShareToChatDialog } from "@/components/share-to-chat-dialog"
import { EmojiReactions } from "@/components/emoji-reactions"
import { TechBadgeList } from "@/components/tech-badge-list"

interface Project {
  id: string
  owner_id: string
  title: string
  description: string
  tech_stack: string[]
  github_url: string
  live_url?: string
  visibility: "public" | "private"
  created_at: any
  githubRepoId?: string
  hasJourney?: boolean
  collaboration_type: "authorized" | "open"
}

interface GitHubStats {
  stars: number
  forks: number
  watchers: number
  language: string
}

interface ProjectOwner {
  username: string
  avatar_url?: string
}

interface Task {
  id: string
  project_id: string
  title: string
  description: string
  status: "todo" | "in-progress" | "done"
  assignee_id?: string
  created_by: string
  created_at: any
  updated_at: any
}

export default function ProjectDetailPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [owner, setOwner] = useState<ProjectOwner | null>(null)
  const [projectLoading, setProjectLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [githubStats, setGithubStats] = useState<GitHubStats | null>(null)
  const [hasJourney, setHasJourney] = useState<boolean>(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareText, setShareText] = useState("")
  const [isCollaborator, setIsCollaborator] = useState(false)

  const handleShare = () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/projects/${projectId}` : `/projects/${projectId}`
    setShareText(`Check out this project: ${url}`)
    setShareOpen(true)
  }
  const handleCopy = () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/projects/${projectId}` : `/projects/${projectId}`
    navigator.clipboard.writeText(url)
  }
  const handleDeleteProject = async () => {
    await deleteDoc(doc(db, "projects", projectId))
    router.push("/projects")
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const projectDoc = await getDoc(doc(db, "projects", projectId))
        if (projectDoc.exists()) {
          const projectData = { id: projectDoc.id, ...projectDoc.data() } as Project

          // Fetch owner info
          const ownerDoc = await getDoc(doc(db, "users", projectData.owner_id))
          if (ownerDoc.exists()) {
            setOwner(ownerDoc.data() as ProjectOwner)
          }

          setProject(projectData)
        }
      } catch (error) {
        console.error("Error fetching project:", error)
      } finally {
        setProjectLoading(false)
      }
    }

    if (user && projectId) {
      fetchProject()
    }
  }, [user, projectId])

  useEffect(() => {
    if (!user || !projectId) return
    const qy = query(collection(db, "collaborations"), where("project_id", "==", projectId), where("user_id", "==", user.uid))
    getDocs(qy).then((snap) => setIsCollaborator(!snap.empty)).catch(() => setIsCollaborator(false))
  }, [user, projectId])

  useEffect(() => {
    if (project?.hasJourney) {
      setHasJourney(true)
    }
  }, [project])

  useEffect(() => {
    const fetchGitHubStats = async () => {
      if (project?.github_url) {
        try {
          const stats = await getGitHubRepoStats(project.id)
          if (stats) {
            setGithubStats({
              stars: stats.stars,
              forks: stats.forks,
              watchers: stats.watchers,
              language: stats.language,
            })
          }
        } catch (error) {
          console.error("Error fetching GitHub stats:", error)
        }
      }
    }

    if (project) {
      fetchGitHubStats()
    }
  }, [project])

  useEffect(() => {
    if (!user || !projectId) return

    const q = query(collection(db, "tasks"), where("project_id", "==", projectId), orderBy("created_at", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[]
      setTasks(tasksData)
    })

    return () => unsubscribe()
  }, [user, projectId])

  if (loading || projectLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Project not found</h1>
          <Link href="/projects">
            <Button>Back to Projects</Button>
          </Link>
        </div>
      </div>
    )
  }

  const isOwner = user.uid === project.owner_id
  const canContribute = isOwner || isCollaborator || project.collaboration_type === 'open'

  const requestToCollaborate = async () => {
    if (!user) return
    await addDoc(collection(db, 'collaboration_requests'), {
      project_id: projectId,
      requester_id: user.uid,
      created_at: serverTimestamp(),
      status: 'pending',
    })
  }

  const todoTasks = tasks.filter((t) => t.status === "todo")
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress")
  const doneTasks = tasks.filter((t) => t.status === "done")

  return (
    <div className="min-h-screen bg-background">
      <UniversalNav />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/projects" className="text-primary hover:underline mb-6 inline-block">
          Back to Projects
        </Link>

        <div className="bg-card border border-border rounded-lg p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">{project.title}</h1>
              {owner && (
                <Link href={`/profile/${project.owner_id}`} className="text-primary hover:underline">
                  by {owner.username}
                </Link>
              )}
            </div>
            {isOwner && (
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={handleShare}><Share2 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={handleCopy}><Copy className="w-4 h-4" /></Button>
                {isOwner && (
                  <>
                    <Link href={`/projects/${projectId}/edit`}>
                      <Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={handleDeleteProject}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </>
                )}
              </div>
            )}
          </div>

          <p className="text-lg text-muted-foreground">{project.description}</p>

          <div>
            <h3 className="font-bold mb-3">Technology Stack</h3>
            <TechBadgeList items={project.tech_stack} />
            <EmojiReactions parentId={projectId} collectionName="projects" />
          </div>

          {githubStats && (
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Github className="w-5 h-5 text-slate-300" />
                <h3 className="font-semibold text-slate-200">GitHub Stats</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold text-yellow-400">{githubStats.stars}</div>
                  <div className="text-xs text-slate-400">Stars</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">{githubStats.forks}</div>
                  <div className="text-xs text-slate-400">Forks</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">{githubStats.watchers}</div>
                  <div className="text-xs text-slate-400">Watchers</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 flex-wrap">
            {project.github_url && (
              <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                <Button>View on GitHub</Button>
              </a>
            )}
            {project.live_url && (
              <a href={project.live_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="bg-transparent">
                  Visit Live Site
                </Button>
              </a>
            )}
            <Link href={`/projects/${projectId}/reviews`}>
              <Button variant="outline" className="bg-transparent gap-2">
                <Code className="w-4 h-4" />
                Code Reviews
              </Button>
            </Link>
            {hasJourney && (
              <Link href={`/projects/${projectId}/journey`}>
                <Button variant="outline" className="bg-transparent gap-2">
                  <BookOpen className="w-4 h-4" />
                  Project Journey
                </Button>
              </Link>
            )}
            {!isOwner && project.collaboration_type === 'authorized' && !isCollaborator && (
              <Button variant="outline" className="bg-transparent" onClick={requestToCollaborate}>
                Request to Collaborate
              </Button>
            )}
            {project.collaboration_type === 'open' && !isOwner && (
              <span className="text-xs text-muted-foreground">Open collaboration enabled</span>
            )}
            {isOwner && (
              <Link href={`/projects/${projectId}/collaborators`}>
                <Button variant="outline" className="bg-transparent gap-2">
                  <Users className="w-4 h-4" />
                  Collaborators
                </Button>
              </Link>
            )}
          </div>

          <div className="pt-6 border-t border-border text-sm text-muted-foreground">
            <p>Created {project.created_at?.toDate?.()?.toLocaleDateString() || "recently"}</p>
          </div>
        </div>

        <div className="mt-8 bg-card border border-border rounded-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Tasks</h2>
            {isOwner && (
              <Link href={`/projects/${projectId}/tasks/new`}>
                <Button>Create Task</Button>
              </Link>
            )}
          </div>

          <Tabs defaultValue="todo" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="todo">To Do ({todoTasks.length})</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress ({inProgressTasks.length})</TabsTrigger>
              <TabsTrigger value="done">Done ({doneTasks.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="todo" className="space-y-4 mt-4">
              {todoTasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No tasks to do</p>
              ) : (
                todoTasks.map((task) => (
                  <Link key={task.id} href={`/projects/${projectId}/tasks/${task.id}`}>
                    <div className="p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                      <h3 className="font-semibold mb-1">{task.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                    </div>
                  </Link>
                ))
              )}
            </TabsContent>
            <TabsContent value="in-progress" className="space-y-4 mt-4">
              {inProgressTasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No tasks in progress</p>
              ) : (
                inProgressTasks.map((task) => (
                  <Link key={task.id} href={`/projects/${projectId}/tasks/${task.id}`}>
                    <div className="p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                      <h3 className="font-semibold mb-1">{task.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                    </div>
                  </Link>
                ))
              )}
            </TabsContent>
            <TabsContent value="done" className="space-y-4 mt-4">
              {doneTasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No completed tasks</p>
              ) : (
                doneTasks.map((task) => (
                  <Link key={task.id} href={`/projects/${projectId}/tasks/${task.id}`}>
                    <div className="p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                      <h3 className="font-semibold mb-1">{task.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                    </div>
                  </Link>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
        <ShareToChatDialog open={shareOpen} onOpenChange={setShareOpen} initialText={shareText} />
      </main>
    </div>
  )
}
